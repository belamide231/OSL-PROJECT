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


export const sendMessageService = async (data: sendMessageDto, senderId: number): Promise<number | object> => {
    if(isNaN(data.receiverId) || !validContentType.includes(data.contentType!) || !data.content || !data.uuid )
        return 422;

    try {

        
        const results = await redis.con.sendCommand(['FCALL', 'set_message', '0', JSON.stringify(new messageModel(senderId, data.receiverId, data.contentType, data.content))]) as string;
        setCachedTimer(results[1]);

        let connections: string[] = [];
        connections = connections.concat(socketClients.clientConnections[senderId]);
        connections = connections.concat(socketClients.clientConnections[data.receiverId]);
        io.to(connections).emit('receive message', { messageId: results[0], senderId });

        io.to(socketClients.clientConnections[senderId]).emit('receive message', { messageId: results[0], chatmateId: data.receiverId });
        io.to(socketClients.clientConnections[data.receiverId]).emit('receive message', { messageId: results[0], chatmateId: senderId });

        return { uuid: data.uuid };

    } catch (err) {

        console.log(err);
        console.log("REDIS ERROR");
        return 500;
    }
}


export const migrateCachedMessages = async (chatId: string): Promise<void> => {

    const messages = JSON.parse((await redis.con.sendCommand(['FCALL', 'get_chat', '0', chatId]) as any))[0];

    let sql = '';
    messages.forEach((x: any) => sql += insertMessage(x));

    try {

        await mysql.promise().query(sql);
        await redis.con.del(chatId);


    } catch (err) {

        console.log(err);
        console.log("MYSQL ERROR");
    }
}


export const loadMessageService = async (data: loadMessageDto, userId: number, name: string): Promise<object | number> => {
    if(isNaN(data.messageId) || isNaN(data.chatmateId))
        return 422;

    try {

        const result = await redis.con.sendCommand(['FCALL', 'get_message', '0', userId.toString(), data.chatmateId.toString(), data.messageId.toString()]) as string;
        
        const message = JSON.parse(result);
        const chatmateId = message.sender_id !== userId ? message.sender_id : message.receiver_id;
        let chatmate = await redis.con.get(`chats:users:${chatmateId}:name`);

        if(!chatmate) {
            
            chatmate = (await mysql.promise().query('SELECT first_name FROM tbl_profiles WHERE user_id = ?', [chatmateId]) as any)[0][0].first_name as string;

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

        console.log("REDIS ERROR");
        console.log(err);
        return 500;
    }
}

/**
 * @param data - Ilisanan natog chatListLength since usa ra ang attributes sa object
 */
export const loadChatListServices = async (user: User, chatListLength: number): Promise<{ status: number, result: object | null }> => {
    if(isNaN(chatListLength))
        return { status: 422, result: null };

    try {

        let redisChatList = JSON.parse(await redis.con.sendCommand(['FCALL', 'get_chats', '0', user.id.toString()]) as string) as any;
        let idsOfChatmates: any = [];
        redisChatList = redisChatList.map((x: any) => {
            x[0].sender_id == user.id ? x[0].sender = user.name : x[0].receiver = user.name
            idsOfChatmates.push(x[0].chatmate_id)
            return x; 
        })

        const chatmateNames = await mysql.promise().query('SELECT first_name as name FROM tbl_profiles WHERE FIND_IN_SET(user_id, ?)', [idsOfChatmates.toString()]) as any;
        idsOfChatmates.forEach((x: any, i: number) => {
            // PAG BUTANG SA GI QUERY NGA NAMES SA REDISCHATLIST
            x.name
        })

        
        const result = (await mysql.promise().query('CALL get_chat_list(?, ?)', [chatListLength, user.id]) as any)[0];
        if(result.fieldCount === 0)
            return { status: 200, result: { chatList: [], order: [] } };

        result.splice(result.length - 1, 1);
        // console.log(result);
        return { status: 200, result: { chatList: result, order: result.map((x: any) => x[0].chatmate_id) } };

    } catch(err) {

        console.log(err);
        console.log("MYSQL ERROR");
        return { status: 500, result: null };
    }
}


export const loadMessagesService = async (userId: number, data: getConversationDto): Promise<{ status: number, result: object | null }> => {
    if(isNaN(data.chatmateId) || isNaN(data.messageLength))
        return { status: 422, result: null };

    try {

        const result = (await mysql.promise().query('CALL load_messages(?, ?, ?, ?)', [data.messageLength, userId, data.chatmateId, 15]) as any)[0][0];
        return { status: 200, result: result };

    } catch {

        console.log("MYSQL ERROR");
        return { status: 500, result: null };
    }
}


export const deliveredChatService = async (userId: number): Promise<any> => {
    if(!deliveredChatService)
        return 422;

    try {

        const result = (await mysql.promise().query("CALL chat_delivered(?)", [userId]) as any)[0].slice(0, 2);
        return result;

    } catch (err) {

        console.log("MYSQL ERROR");
        return 500;
    }
}


export const seenChatService = async (userId: number, chatmateId: number): Promise<number> => {
    if(isNaN(chatmateId))
        return 422;

    try {

        const result = (await mysql.promise().query('CALL seen_chat(?, ?)', [userId, chatmateId]) as any)[0][0][0];
        return result;

    } catch {

        console.log("MYSQL ERROR");
        return 500;
    }
}