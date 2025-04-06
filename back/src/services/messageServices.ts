import { mysql, io, redis } from "../app";
import { sendMessageDto } from "../dto/messageController/sendMessageDto";
import { Message } from "../model/messageModel";
import { setCachedTimer } from "../utilities/bullmq";
import { insertMessage } from "../calls/InsertMessage";
import { loadMessageDto } from "../dto/messageController/loadMessageDto";
import { User } from "../interfaces/user";
import { TimeStamp } from "../utilities/stamp";
import { migrationStatus } from "../calls/migrationStatus";
import { migrateStatusByLoadingMoreMessages } from "../calls/migrateStatusByLoadingMoreMessages";
import { Connection } from "../sockets/connection";


export const getActiveClientsService = async (company: string, role: string | null): Promise<any> => {

    let activeUsers: any = [];

    const companies = ['ibc', 'jet', 'gis'];

    const activeAccountsIdList = await redis.con.lRange(`company:${company}:active_users:account:list`, 0, -1);
    if(activeAccountsIdList.length !== 0) {
        const activeAccountsInformation = (await Promise.all(
            activeAccountsIdList.map(async accountId => {
                const accountInformation = await redis.con.get(`specific_user:${accountId}:information`);
                if(accountInformation === null) {
                    return false;
                }
                return JSON.parse(accountInformation);
            })
        )).filter(Boolean);
        if(activeAccountsInformation.length === 0) {
            activeUsers = activeUsers.concat(activeAccountsInformation);
        }
    }

    if(role === 'admin') {
        const activeAdminsIdListInEachCompany = await Promise.all(companies.map(async company => await redis.con.lRange(`company:${company}:active_users:admin:list`, 0, -1)));
        let activeAdminsInAllCompanyMergedTogather: any = [];
        activeAdminsIdListInEachCompany.forEach(eachCompanyAdminList => activeAdminsInAllCompanyMergedTogather = activeAdminsInAllCompanyMergedTogather.concat(eachCompanyAdminList));
        const activeAdminsInformation = await Promise.all(activeAdminsIdListInEachCompany.map(async adminId => {
            const adminInformation = await redis.con.get(`specific_user:${adminId}:information`);
            if(adminInformation === null) {
                return false;
            }
            return JSON.parse(adminInformation);
        }));
        activeUsers = activeUsers.concat(activeAdminsInformation.filter(Boolean));

    } else if(role === 'account') {

        const activeAdminsIdList = await redis.con.lRange(`company:${companies}:active_users:admin:list`, 0, -1);
        const activeAdminInformation = await Promise.all(activeAdminsIdList.map(async adminId => {
            const adminInformation = await redis.con.get(`specific_user:${adminId}:information`);
            if(adminInformation === null) {
                return false;
            }
            return JSON.parse(adminInformation);
        }));
        activeUsers = activeUsers.concat(activeAdminInformation.filter(Boolean));
    }

    return activeUsers;
}


export const sendMessageService = async (senderId: number, data: sendMessageDto): Promise<number | object> => {
    if(!data.receiverId || !data.content || !data.uuid || !data.contentType ) {
        return 422;
    }

    try {

        const results = await redis.con.sendCommand(['FCALL', 'set_message', '0', JSON.stringify(new Message(senderId, data.receiverId, data.contentType, data.content))]) as string;
        setCachedTimer({ chatKey: results[1], users: [senderId, data.receiverId] });

        let connections: string[] = [];

        /** Tangtangonon */
        // connections = connections.concat(socketClients.clientConnections[senderId]);
        // connections = connections.concat(socketClients.clientConnections[data.receiverId]);
        /** Pinaka last sa tangtangonon */

        /** Ang eh Puli */
        const senderConnectionsInRedisKey = Connection.Keys.keyForUserConnections(senderId);
        const senderConnectionsInRedis = await redis.con.lRange(senderConnectionsInRedisKey, 0, -1);
        if(senderConnectionsInRedis.length !== 0) {
            connections = connections.concat(senderConnectionsInRedis);
        }

        const receiverConnectionsInRedisKey = Connection.Keys.keyForUserConnections(data.receiverId);
        const receiverConnectionInRedis = await redis.con.lRange(receiverConnectionsInRedisKey, 0, -1);
        if(receiverConnectionInRedis.length !== 0) {
            connections = connections.concat(receiverConnectionInRedis);
        }
        /** Pinaka last sa eh puli */

        /** Tangtangonon */
        io.to(connections).emit('notifyReceiverHisNewMessage', { messageId: results[0], senderId });

        if(senderConnectionsInRedis.length !== 0) {
            io.to(senderConnectionsInRedis).emit('notifyReceiverHisNewMessage', { messageId: results[0], chatmateId: data.receiverId });
        }
        if(receiverConnectionInRedis.length !== 0) {
            io.to(receiverConnectionInRedis).emit('notifyReceiverHisNewMessage', { messageId: results[0], chatmateId: senderId });
        }
        /** Pinaka last sa tangtangonon */

        return { uuid: data.uuid };

    } catch (err) {

        console.log(err);
        console.log('FUNCTION "sendMessageService"');
        return 500;
    }
}


// Transfering the messages that are stored in redis to database.
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

        console.log('chatmate', chatmate);

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
        let idsOfChatmates: any = [];``

        if(redisChatList.length !== 0) {

            redisChatList = JSON.parse(redisChatList);
            redisChatList = redisChatList.map((x: any) => {
                x[0].sender_id == user.id ? x[0].sender = user.name : x[0].receiver = user.name
                idsOfChatmates.push(x[0].chatmate_id)
                return x; 
            });
    
            let [rows] = await mysql.promise().query('SELECT first_name as name FROM tbl_profiles WHERE FIND_IN_SET(user_id, ?)', [idsOfChatmates.toString()]) as any;
    
            idsOfChatmates.forEach((x: any, i: number) => {

                const index = redisChatList.findIndex((x: any) => x[0].chatmate_id === idsOfChatmates[i]);
                const rowsIndex = (rows.length - 1) - i;
                redisChatList[index][0].chatmate = rows[rowsIndex].name;
                redisChatList[index][0].sender === false ? redisChatList[index][0].sender = rows[rowsIndex].name : redisChatList[index][0].receiver = rows[rowsIndex].name;
                rows[rowsIndex]['id'] = x;
            });
    
            rows.length !== 0 && await redis.con.sendCommand(['FCALL', 'set_names', '0', JSON.stringify(rows)]);
        }

        let [mysqlChatList]: any[] = await mysql.promise().query('CALL get_chat_list(?, ?, ?)', [chatListLength, user.id, idsOfChatmates.toString()]) as any;
        if(Array.isArray(mysqlChatList)) {
            mysqlChatList.pop();
        } else {
            mysqlChatList = [];
        }

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
            const [db] = await mysql.promise().query(sql) as any;

            db.forEach((element: any, index: number) => {
                if(typeof element === 'object' && element !== null) {
                    db.splice(index, 1);
                }
            });

            if(Array.isArray(jsonCache.message)) {
                jsonCache.messages = jsonCache.messages.concat(db[0]);
            } else {
                jsonCache.messages = db[0];
            }
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