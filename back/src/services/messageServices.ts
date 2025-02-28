import { mysql, socketClients, io, redis } from "../app";
import { getConversationDto } from "../dto/messageController/getConversationDto";
import { sendMessageDto } from "../dto/messageController/sendMessageDto";
import { validContentType } from "../validations/validContentType";
import { validRoles } from "../validations/validRoles";
import { messageModel } from "../model/messageModel";
import { setCachedTimer } from "../utilities/bullmq";
import { insertMessage } from "../calls/InsertMessage";
import { loadMessageDto } from "../dto/messageController/loadMessageDto";
import { User } from "../interfaces/user";


export const getActiveClientsService = async (role: string): Promise<{ status: number, result: object | null }> => {
    if(!validRoles.includes(role))
        return { status: 422, result: null };

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
    if(isNaN(data.receiverId) || !validContentType.includes(data.contentType!) || !data.content || !data.uuid )
        return 422;

    try {

        const results = await redis.con.sendCommand(['FCALL', 'set_message', '0', JSON.stringify(new messageModel(senderId, data.receiverId, data.contentType, data.content))]) as string;
        setCachedTimer({ chatKey: results[1], users: [senderId, data.receiverId] });

        let connections: string[] = [];
        connections = connections.concat(socketClients.clientConnections[senderId]);
        connections = connections.concat(socketClients.clientConnections[data.receiverId]);
        io.to(connections).emit('receive message', { messageId: results[0], senderId });

        io.to(socketClients.clientConnections[senderId]).emit('receive message', { messageId: results[0], chatmateId: data.receiverId });
        io.to(socketClients.clientConnections[data.receiverId]).emit('receive message', { messageId: results[0], chatmateId: senderId });

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

        if(!messagesTail[x.sender_id] && messages[(messages.length - 1) - i].content_status !== 'sent') 
            messagesTail[x.sender_id] = messages[(messages.length - 1) - i];
    });

    Object.values(messagesTail).forEach((x: any) => sql = `CALL migration_status(${x.sender_id}, ${x.receiver_id}, '${x.content_status}', ${x.delivered_at}, ${x.seen_at});\n` + sql);

    try {

        await mysql.promise().query(sql);
        await redis.con.sendCommand(['FCALL', 'delete_chat', '0', JSON.stringify(data)]);

    } catch (err) {

        console.log(err);
        console.log('MYSQL "migrateCachedMessages"');
    }
}


export const loadMessageService = async (data: loadMessageDto, userId: number, name: string): Promise<object | number> => {
    if(isNaN(data.messageId) || isNaN(data.chatmateId))
        return 422;

    try {

        const result = await redis.con.sendCommand(['FCALL', 'get_message', '0', userId.toString(), data.chatmateId.toString(), data.messageId.toString()]) as string | null;
        const message = JSON.parse(result as string);
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

    if(isNaN(chatListLength))
        return 422;

    try {

        let redisChatList: any = await redis.con.sendCommand(['FCALL', 'get_chats', '0', user.id.toString()]);
        let idsOfChatmates: any = [];

        if(redisChatList !== null) {

            redisChatList = JSON.parse(redisChatList);
            redisChatList = redisChatList.map((x: any) => {

                x[0].sender_id == user.id ? x[0].sender = user.name : x[0].receiver = user.name
                idsOfChatmates.push(x[0].chatmate_id)
                return x; 
            });
    
            let chatmateNames = await mysql.promise().query('SELECT first_name as name FROM tbl_profiles WHERE FIND_IN_SET(user_id, ?)', [idsOfChatmates.toString()]) as any;
    
            idsOfChatmates.forEach((x: any, i: number) => {
                const index = redisChatList.findIndex((x: any) => x[0].chatmate_id === idsOfChatmates[i]);
                redisChatList[index][0].chatmate = chatmateNames[0][0].name;
                redisChatList[index][0].sender === false ? redisChatList[index][0].sender = chatmateNames[0][0].name : redisChatList[index][0].receiver = chatmateNames[0][0].name;
                chatmateNames[0][(chatmateNames[0].length - i) - 1]['id'] = x;
            });
    
            chatmateNames.length !== 0 && await redis.con.sendCommand(['FCALL', 'set_names', '0', JSON.stringify(chatmateNames[0])]);

        } else 
            redisChatList = [];

        let [mysqlChatList]: any[] = await mysql.promise().query('CALL get_chat_list(?, ?, ?)', [chatListLength, user.id, idsOfChatmates.toString()]);
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


export const loadMessagesService = async (userId: number, data: getConversationDto): Promise<{ status: number, result: object | null }> => {
    if(isNaN(data.chatmateId) || isNaN(data.messageLength))
        return { status: 422, result: null };

    try {

        const result = (await mysql.promise().query('CALL load_messages(?, ?, ?, ?)', [data.messageLength, userId, data.chatmateId, 15]) as any)[0][0];
        return { status: 200, result: result };

    } catch (err) {

        console.log(err);
        console.log('FUNCTION "loadMessagesService"');
        return { status: 500, result: null };
    }
}


export const deliveredChatService = async (userId: number): Promise<any> => {
    if(!deliveredChatService)
        return 422;

    try {

        // TANGTANGONON NATO ANG MYSQL NYA EH PULI ANG REDIS

        const mysqlResult = (await mysql.promise().query("CALL chat_delivered(?)", [userId]) as any)[0].slice(0, 2);
        return mysqlResult;

    } catch (err) {

        console.log(err);
        console.log('FUNCTION "deliveredChatService"');
        return 500;
    }
}


export const seenChatService = async (userId: number, chatmateId: number): Promise<number> => {
    if(isNaN(chatmateId))
        return 422;

    try {

        const result = (await mysql.promise().query('CALL seen_chat(?, ?)', [userId, chatmateId]) as any)[0][0][0];
        return result;

    } catch (err) {

        console.log(err);
        console.log('FUNCTION "seenChatService"');
        return 500;
    }
}