import { mysql, socketClients, io, redis } from "../app";
import { sendMessageDto } from "../dto/messageController/sendMessageDto";
import { validRoles } from "../validations/validRoles";
import { Message } from "../model/messageModel";
import { setCachedTimer } from "../utilities/bullmq";
import { insertMessage } from "../calls/InsertMessage";
import { loadMessageDto } from "../dto/messageController/loadMessageDto";
import { User } from "../interfaces/user";
import { TimeStamp } from "../utilities/stamp";
import { migrationStatus } from "../calls/migrationStatus";
import { migrateStatusByLoadingMoreMessages } from "../calls/migrateStatusByLoadingMoreMessages";

export const getActiveClientsService = async (role: string): Promise<{ status: number, result: object | null }> => {
    if(!validRoles.includes(role)) {
        return { status: 422, result: null };
    }

    let actives: any = [];
    switch(role) {
        case 'admin':
            actives = actives.concat(socketClients.adminsId);
            actives = actives.concat(socketClients.accountsId);
            break;
        case 'account':
            actives = actives.concat(socketClients.adminsId);
            actives = actives.concat(socketClients.superUsersId);
            break;
        case 'superUser':
            actives = actives.concat(socketClients.accountsId);
            break;
        default:
            break;
    }

    if(actives.length === 0)
        return { status: 200, result: [] };

    const result = await redis.con.mGet([...actives.map((v: any) => 'db4:' + v.toString())]);
    const sids = result.map((v: any) => {
        if(v !== null)
            return v.toString();
    }) as string[];

    if(sids.length === 0)
        return { status: 200, result: [] };

    const data = await redis.con.mGet([...sids]);
    const json = data.map(v => {
        if(v !== null)
            return JSON.parse(v);
    });

    if(json.length === 0)
        return { status: 200, result: [] };

    return { status: 200, result: json };
}


export const sendMessageService = async (senderId: number, data: sendMessageDto): Promise<number | object> => {
    if(!data.receiverId || !data.content || !data.uuid || !data.contentType ) {
        return 422;
    }

    try {

        const results = await redis.con.sendCommand(['FCALL', 'set_message', '0', JSON.stringify(new Message(senderId, data.receiverId, data.contentType, data.content))]) as string;
        setCachedTimer({ chatKey: results[1], users: [senderId, data.receiverId] });

        let connections: string[] = [];
        connections = connections.concat(socketClients.clientConnections[senderId]);
        connections = connections.concat(socketClients.clientConnections[data.receiverId]);

        io.to(connections).emit('notifyReceiverHisNewMessage', { messageId: results[0], senderId });
        io.to(socketClients.clientConnections[senderId]).emit('notifyReceiverHisNewMessage', { messageId: results[0], chatmateId: data.receiverId });
        io.to(socketClients.clientConnections[data.receiverId]).emit('notifyReceiverHisNewMessage', { messageId: results[0], chatmateId: senderId });

        return { uuid: data.uuid };

    } catch (err) {

        console.log(err);
        console.log('FUNCTION "sendMessageService"');
        return 500;
    }
}


export const migrateCachedMessages = async (data: { chatKey: string, users: number[] }): Promise<void> => {

    let sql = '';
    const messages = JSON.parse((await redis.con.sendCommand(['FCALL', 'get_chat', '0', data.chatKey]) as any))[0];
    const messagesTail: any = {};

    messages.forEach((x: any, i: number) => {

        sql += insertMessage(x);

        if(!messagesTail[x.sender_id] && messages[(messages.length - 1) - i].content_status !== 'sent') {
            messagesTail[x.sender_id] = messages[(messages.length - 1) - i];
        }
    });

    Object.values(messagesTail).forEach((x: any) => {
        sql = migrationStatus(x) + sql;
    });

    try {

        await mysql.promise().query(sql);
        await redis.con.sendCommand(['FCALL', 'delete_chat', '0', JSON.stringify(data)]);

    } catch (err) {

        console.log(err);
        console.log('MYSQL "migrateCachedMessages"');
    }
}


export const loadMessageService = async (data: loadMessageDto, userId: number, name: string): Promise<object | number> => {
    if(isNaN(data.messageId) || isNaN(data.chatmateId)) {
        return 422;
    }

    try {

        const result = await redis.con.sendCommand(['FCALL', 'get_message', '0', userId.toString(), data.chatmateId.toString(), data.messageId.toString()]) as string | null;
        const message = JSON.parse(result as string);

        message.sent_at = new Date(message.sent_at);

        if(message.delivered_at !== null) {
            message.delivered_at = new Date(message.delivered_at);
        }

        if(message.seen_at !== null) {
            message.seen_at = new Date(message.seen_at);
        }

        const chatmateId = message.sender_id !== userId ? message.sender_id : message.receiver_id;
        let chatmate = await redis.con.get(`chats:users:${chatmateId}:name`);

        if(!chatmate) {
            
            chatmate = (await mysql.promise().query(`SELECT first_name FROM tbl_profiles WHERE user_id = ?`, [chatmateId]) as any)[0][0].first_name as string;

            await redis.con.set(`chats:users:${chatmateId}:name`, chatmate, { 
                EX: 60 * 60
            });
        }

        message['chatmate'] = chatmate;
        message['chatmate_id'] = chatmateId;

        if(message.sender_id === chatmateId) {

            message['sender'] = chatmate;
            message['receiver'] = name;

        } else {

            message['sender'] = name;
            message['receiver'] = chatmate;
        }

        return message;

    } catch (err) {

        console.log(err);
        console.log('FUNCTION "loadMessageService"');
        return 500;
    }
}


export const loadChatListServices = async (user: User, chatListLength: number): Promise<object | number> => {

    if(isNaN(chatListLength)) {
        return 422;
    }

    try {

        let redisChatList: any = await redis.con.sendCommand(['FCALL', 'get_chats', '0', user.id.toString()]);
        let idsOfChatmates: any = [];

        if(redisChatList.length !== 0) {

            redisChatList = JSON.parse(redisChatList);
            redisChatList = redisChatList.map((x: any) => {
                x[0].sender_id == user.id ? x[0].sender = user.name : x[0].receiver = user.name
                idsOfChatmates.push(x[0].chatmate_id)
                return x; 
            });
    
            let [rows, result] = await mysql.promise().query('SELECT first_name as name FROM tbl_profiles WHERE FIND_IN_SET(user_id, ?)', [idsOfChatmates.toString()]) as any;
    
            idsOfChatmates.forEach((x: any, i: number) => {

                const index = redisChatList.findIndex((x: any) => x[0].chatmate_id === idsOfChatmates[i]);
                const rowsIndex = (rows.length - 1) - i;
                redisChatList[index][0].chatmate = rows[rowsIndex].name;
                redisChatList[index][0].sender === false ? redisChatList[index][0].sender = rows[rowsIndex].name : redisChatList[index][0].receiver = rows[rowsIndex].name;
                rows[rowsIndex]['id'] = x;
            });
    
            rows.length !== 0 && await redis.con.sendCommand(['FCALL', 'set_names', '0', JSON.stringify(rows)]);
        }

        let [mysqlChatList, result]: any[] = await mysql.promise().query('CALL get_chat_list(?, ?, ?)', [chatListLength, user.id, idsOfChatmates.toString()]) as any;
        Array.isArray(mysqlChatList) ? mysqlChatList.pop() : mysqlChatList = [];

        const chatList = redisChatList.concat(mysqlChatList);
        const order = idsOfChatmates.concat(mysqlChatList.map((x: any) => x[0].chatmate_id));

        return { chatList, order };

    } catch(err) {

        console.log(err);
        console.log('FUNCTION "loadChatListServices"');
        return 500;
    }
}


export const loadMoreMessagesService = async (user: User, data: { lengthOfExistingMessages: number, chatmateId: number }): Promise<number | object[]> => {
    if(isNaN(data.chatmateId) || isNaN(data.lengthOfExistingMessages)) {
        return 422;
    }

    try {

        const cache: any = await redis.con.sendCommand(['FCALL', 'get_messages', '0', user.id.toString(), data.chatmateId.toString(), data.lengthOfExistingMessages.toString()]) as string | null;
        
        if(cache === null) {
            const [[db]] = await mysql.promise().query('CALL load_more_messages(?, ?, ?, ?)', [data.lengthOfExistingMessages, user.id, data.chatmateId, 15]) as any;
            return db;
        }

        const jsonCache = JSON.parse(cache);

        if(jsonCache.length !== 15) {    
            let sql = '';

            if(['delivered', 'seen'].includes(jsonCache.messages_status.user.content_status)) {
                
                const jsonStatus = {
                    senderId: user.id, 
                    receiverId: data.chatmateId, 
                    status: jsonCache.messages_status.user.content_status, 
                    deliveredAt: jsonCache.messages_status.user.delivered_at, 
                    seenAt: jsonCache.messages_status.user.seen_at
                };
                sql += migrateStatusByLoadingMoreMessages(jsonStatus);
            }

            if(['delivered', 'seen'].includes(jsonCache.messages_status.chatmate.content_status)) {
                
                const jsonStatus = {
                    senderId: data.chatmateId,
                    receiverId: user.id,  
                    status: jsonCache.messages_status.chatmate.content_status, 
                    deliveredAt: jsonCache.messages_status.chatmate.delivered_at, 
                    seenAt: jsonCache.messages_status.chatmate.seen_at
                };
                sql += migrateStatusByLoadingMoreMessages(jsonStatus);
            }


            sql += `CALL load_more_messages(0, ${user.id}, ${data.chatmateId}, ${15 - jsonCache.length});`;

            const [[db]] = await mysql.promise().query(sql) as any;
            jsonCache.messages = jsonCache.messages.concat(db);
        }

        return jsonCache.messages;

    } catch (err) {

        console.log(err);
        console.log('FUNCTION "loadMessagesService"');
        return 500;
    }
}



export const editingTheMessageStatusToDeliveredService = async (seenerId: number, senderId: number): Promise<number | { updated: boolean, stamp: Date }> => {
    if(!seenerId || !senderId) {
        return 422;
    }

    const stamp: string = TimeStamp();
    const result = await redis.con.sendCommand(['FCALL', 'update_chat_to_delivered', '0', seenerId.toString(), senderId.toString(), stamp]) as string;
    return { updated: Boolean(result), stamp: new Date(stamp) };
}



export const editingAllTheChatStatusToDeliveredService = async (userId: number): Promise<number | { chatmates: number[], stamp: Date }> => {
    if(!userId) {
        return 422;
    }

    try {

        const stamp = TimeStamp();
        let redisResult: any = await redis.con.sendCommand(['FCALL', 'delivered_message', '0', userId.toString()]);
        if(redisResult === null) {
            redisResult = [];
        }

        return { chatmates: redisResult, stamp: new Date(stamp) };

    } catch (err) {

        console.log(err);
        console.log('FUNCTION "deliveredChatService"');
        return 500;
    }
}


export const seenChatService = async (seenerId: number, chatmateId: number): Promise<number | { timestamp: string }> => {
    if(isNaN(chatmateId)) {
        return 422;
    }

    try {

        const stamp = TimeStamp();
        await redis.con.sendCommand(['FCALL', 'seen_message', '0', seenerId.toString(), chatmateId.toString(), stamp]);

        return { timestamp: stamp };

    } catch (err) {

        console.log(err);
        console.log('FUNCTION "seenChatService"');
        return 500;
    }
}