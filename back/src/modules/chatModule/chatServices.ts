import { mysql, io, redis } from "../../app";
import { ChatPreservationTimer } from "../../utilities/bullmq";
import { TimeStamp } from "../../utilities/stamp";
import { MessageModel } from "./models/messageModel";
import { MessagesSqlConverter } from "./calls/MessagesSql";
import { MemberSqlConverter } from "./calls/MemberSql";
import { Message } from "./interfaces/message";


/** chat:chat_id:status                         
 * 
 * @param {number} chat_id
 * 
 * Redis Key: `chat:{chat_id}:status`
 * Type: List
 * 
 * Value Type: JSON string 
    { 
        member_id:                           string,
        member_message_delivered_stamp:      string,
        member_message_seen_stamp:           string
    }
    */
/** chat:chat_id:messages                       
 * 
 * @param {number} chat_id
 * 
 * Redis Key: `chat:{chat_id}:messages`
 * Type: List
 * 
 * Value Type: JSON string
    {
        message_id:    number,
        chat_id:       number,
        sender_id:     string,
        sent_at:       string,
        message_type:  enum('text' | 'file'),
        message:       string
    }
    */
/** specific_user:user_id:chat_list             
 * 
 * @param {string} user_id
 * 
 * Redis Key: `specific_user:{sender_id}:chat_list`
 * Type: List
 * 
 * Value Type: string
 */
/** id_generator:chat                           
 *  Redis Key: 'chat_id_generator'
 *  Type: Pair
 * 
 *  Value Type: number
 */
/** id_generator:message                        
     *  Redis Key: 'message_id_generator'
     *  Type: Pair
     * 
     *  Value Type: number
     */
/** user_information:user_id                    
 *  @Type Object with properties of
    "id": number,
    "name": string,
    "role": string,
    "company": string,
    "picture": string
 */
// ('company:active_users:admin:list') :
// ('company:[company]:active_users:[role]:list')
// ('specific_user:[id]:information')

export async function FetchUsers(Role: string, Company: string): Promise<any> {
    try {

        if(Role === 'customer') 
            return await redis.con.lRange( ('company:[company]:active_users:account:list').replace('[company]', Company), 0, -1)
                .then(async Accounts => await Promise.all(Accounts.map((Account: number | string) => 
                    redis.con.get( ('specific_user:[id]:information').replace('[id]', Account.toString()) )
                )));

        if(Role === 'account')
            return await mysql.promise().query(`
            SELECT 
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', p.user_id,
                        'name', p.first_name,
                        'role', r.role,
                        'company', r.company_name,
                        'picture', p.picture
                    )
                ) AS Authorities
            FROM tbl_profiles AS p
            JOIN tbl_roles AS r
                ON p.user_id = r.user_id
            WHERE r.role = 'admin'`)
            .then(([[{ Admins }]]: any) => 
                Admins)
            .then(async Admins => 
                await Promise.all(Admins.map(async (Admin: any) =>
                    ({ ...Admin, active: await redis.con.exists( ('specific_user:[id]:information').replace('[id]', Admin.id) ) === 1 }))));

        if(Role === 'admin') 
            return await mysql.promise().query(`
            SELECT 
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', p.user_id,
                        'name', p.first_name,
                        'role', r.role,
                        'company', r.company_name,
                        'picture', p.picture
                    )
                ) AS Authorities
            FROM tbl_profiles AS p
            JOIN tbl_roles AS r
                ON p.user_id = r.user_id`)
            .then(([[{ Authorities }]]: any) => 
                Authorities)
            .then(async (Authorities: any[]) => 
                await Promise.all(Authorities.map(async (Authority: any) => 
                    ({ ...Authority, active: await redis.con.exists(  ('specific_user:[id]:information').replace('[id]', Authority.id) ) === 1 }))));

    } catch (Error) {

        console.log('FetchUsers', Error);
        return 500;
    }
}

export async function FetchActives(Role: string, Company: string, Authorities: any[] = []): Promise<any> {
    try {
        console.log(Role);

        'specific_user:[id]:information';
        'company:active_users:admin:list';
        'company:[company]:active_users:[role]:list';

        if(Role === 'customer') {

            return await redis.con.lRange( ('company:[company]:active_users:[role]:list').replace('[company]', Company).replace('[role]', 'account'), 0, -1 ).then(async Accounts => 
                await Promise.all(Accounts.map(Account => 
                    redis.con.get( ('specific_user:[id]:information').replace('[id]', Account) )
                )));
        
        } else if(Role === 'account') {

            return await redis.con.lRange('company:active_users:admin:list', 0, -1).then(async Admins => redis.con.mGet(Admins))
        } 

        Authorities = await Promise.all(['ibc', 'jet', 'gis'].map((company: string) => 
            redis.con.lRange( ('company:[company]:active_users:[role]:list').replace('[company]', company).replace('[role]', 'account'), 0, -1 )))
        .then(async Authorities => [await redis.con.lRange('company:active_users:admin:list', 0, -1), ...Authorities])
        .then(CompanysAccounts => CompanysAccounts.flat())
        .then(Ids => Ids.map(Id => ('specific_user:[id]:information').replace('[id]', Id) ))
        .then(async Accounts => Accounts.length !== 0 ? await redis.con.mGet(Accounts) as string[] : [])
        .then(str => str.map(Account => JSON.parse(Account)));

        return Authorities;

    } catch (error) {

        console.log('FetchActives', error);
        return 500;
    }
}

export async function CreatingMessageService(NewMessage: MessageModel, Members: string[], IsRecepientCustomer: boolean): Promise<object | number> {
    try {

        const Authorities = Members.map((Member: string) => isFinite(Number(Member)) ? Member : false).filter(Boolean) as string[];

        const UsersInformations = await (async function recursion(pointer: number, argkeys: string[]) {
            const { cursor, keys } = await redis.con.scan(pointer, { MATCH: 'user_information:*' })
                .then(Result => {
                    Result.keys = Result.keys.map(key => key.replace('user_information:', ''));
                    return Result;
                });
            if(cursor === 0) 
                return argkeys.concat(keys);
            return recursion(cursor, argkeys.concat(keys));
        })(0, []) as string[ ];

        if(!Authorities.every(Id => UsersInformations.includes(Id))) {
            
            const [ AuthoritiesInformations ] = await mysql.promise().query(`
            SELECT 
                p.user_id AS id,
                p.first_name AS name,
                r.role,
                r.company_name AS company,
                p.picture
            FROM tbl_profiles AS p
            JOIN tbl_roles AS r
                ON p.user_id = r.user_id
            WHERE FIND_IN_SET(p.user_id, ?)`, [Authorities.toString()]) as any;

            await Promise.all(AuthoritiesInformations.map((AuthorInformation: any) => 
                redis.con.set(
                    ('user_information:%d').replace('%d', AuthorInformation.id),
                    JSON.stringify(AuthorInformation),
                    { EX: 3600 }
                )
            ));
        }

        const { existing_in_db, new_message_object, recepients_connections } = await redis.con.sendCommand(['FCALL', 'create_message', '1', JSON.stringify(Members), JSON.stringify(NewMessage), IsRecepientCustomer.toString()]).then(result => JSON.parse(result as string)) as { existing_in_db: boolean, new_message_object: Message, recepients_connections: string[] };
        await ChatPreservationTimer(new_message_object.chat_id.toString());

        recepients_connections.length !== undefined && 
            io.to(recepients_connections).emit('new-message', new_message_object.chat_id);
    
        if(existing_in_db) 
            return 200;

        const [[[ Query ]]] = await mysql.promise().query('CALL creating_chat(?, ?, ?)', [new_message_object.chat_id, Members.toString(), IsRecepientCustomer]) as any;
        if(Query.status !== 200) 
            return 500;

        return { ChatId: new_message_object.chat_id };

    } catch(Error) {

        console.log('CreatingMessageService', Error);
        return 500;
    }
}

export async function FetchMessage(Exists: boolean, ChatId: string): Promise<any> {
    try {

        const Messages = await redis.con.lRange(('chat:?:messages').replace('?', ChatId) , 0, 0).then(result => result.map(element => JSON.parse(element)));
        if(Exists) {
            return { 
                Messages
            };
        }

        return {
            Messages: Messages,
            Status: await redis.con.lRange(('chat:?:status').replace('?', ChatId), 0, -1).then(result => result.map(element => JSON.parse(element)))
        };

    } catch(error) {

        console.log('GetChat', error);
        return 500;
    }
}

export async function TransferPreservedData(ChatId: string): Promise<void> {
    try {
        const PreservedChatData = await redis.con.sendCommand(['FCALL', 'chat_get_chat', '1', ChatId]) as string;
        const ChatInformation = JSON.parse(PreservedChatData) as {
            status_list: [{ 
                member:                              string,
                member_id:                           string,
                member_message_delivered_stamp:      string,
                member_message_seen_stamp:           string
            }], 
            message_list: [{
                sender:                    string
                sender_id:                 string,
                message:                   string,
                message_type:              string,
                message_id:                number,
                chat_id:                   number,
                sent_at:                   string
            }]
        };

        const MessagesSql: string = MessagesSqlConverter(ChatInformation.message_list);
        const MemberSql: string = MemberSqlConverter(ChatInformation.status_list, ChatId);

        await mysql.promise().query(MessagesSql + MemberSql);

    } catch(error) {
        
        console.log('TransferPreservedData', error);
    }
}

// Socket
export async function UpdateChatToSeen(UserId: string, ChatId: string): Promise<void> {
    try {

        const Stamp = TimeStamp();
        const RedisResult: any | null = await redis.con.sendCommand(['FCALL', 'chat_update_seen', '2', ChatId, UserId, Stamp]).then(result => result === null ? result : JSON.parse(result as string));

        if(RedisResult) {
            RedisResult.recepients_connections.length !== undefined && 
                io.to(RedisResult.recepients_connections).emit('mark-status-as-seen', RedisResult.status);
            return;
        }
        
        const [[[{ members, status, is_updated }]]] = await mysql.promise().query('CALL update_chat_status(?, ?, ?, ?)', ['seen', Stamp, ChatId, UserId]) as any;

        if(!is_updated) {
            return;
        }

        const recepients_connections = await Promise.all(members.map((member_id: string) => 
            redis.con.lRange(('specific_user:?:connections').replace('?', member_id), 0, -1)
        )).then(result => result.flat());

        io.to(recepients_connections).emit('mark-status-as-seen', status);

    } catch (error) {

        console.log('CreatingMessageService', error);
    }
}

// Socket
export async function UpdateChatToDelivered(UserId: string, ChatId: string): Promise<void> {
    try {

        const Stamp = TimeStamp();
        const RedisResult: any | null = await redis.con.sendCommand(['FCALL', 'chat_update_delivered', '2', ChatId, UserId, Stamp]).then(result => result === null ? result : JSON.parse(result as string));
        
        if(RedisResult) {
            RedisResult.recepients_connections.length !== undefined &&
                io.to(RedisResult.recepients_connections).emit('mark-status-as-delivered', RedisResult.status);
            return;
        }

        const [[[{ members, status, is_updated }]]] = await mysql.promise().query('CALL update_chat_status(?, ?, ?, ?)', ['delivered', Stamp, ChatId, UserId]) as any;
        console.log(status);

        if(!is_updated) {
            return;
        }

        const recepients_connections = await Promise.all(members.map((member_id: string) => 
            redis.con.lRange(('specific_user:?:connections').replace('?', member_id), 0, -1)
        )).then(result => result.flat());

        io.to(recepients_connections).emit('mark-status-as-delivered', status);

    } catch(error) {
        
        console.log('UpdateChatToDelivered', error);
    }
}

// Socket
export async function UpdateChatsToDelivered(UserId: string): Promise<void> {
    try {
        
        const Stamp = TimeStamp();
        const RedisResult = await redis.con.sendCommand(['FCALL', 'chats_update_delivered', '1', UserId, Stamp]).then(result => result === null ? result : JSON.parse(result as string)) as any;

        if(RedisResult) {
            RedisResult.recepients.forEach((recepients: any) => 
                recepients.recepients_connections.length !== undefined &&
                    io.to(recepients.recepients_connections).emit('mark-status-as-delivered', recepients.status));
        }

        const [[ Recepients ]] = await mysql.promise().query('CALL update_all_chat_to_delivered(?, ?, ?)', [Stamp, UserId, RedisResult === null ? '' : RedisResult.chats.toString()]) as any;
        await Promise.all(Recepients.map(async (Recepient: any) => {
            Recepient.recepients_connections = await Promise.all(Recepient.members.map((member: string) => 
                redis.con.lRange(('specific_user:?:connections').replace('?', member), 0, -1)
            )).then(result => result.flat());
            delete Recepient['members'];
        }));

        await Promise.all(Recepients.map(({ recepients_connections, status }: any) => io.to(recepients_connections).emit('mark-status-as-delivered', status)));

    } catch (error) {

        console.log('DeliveredMessageService', error);
    }
}

export async function CustomerChat(UserId: string): Promise<number | object> {
    try {

        const [ ChatId ] = await redis.con.lRange(`specific_user:${UserId}:chat_list`, 0, 0);
        if(!ChatId) {
            return 204;
        }

        const Chat = await Promise.all([
            redis.con.lRange(`chat:${ChatId}:messages`, 0, 15),
            redis.con.lRange(`chat:${ChatId}:status`, 0, -1)
        ]).then(([messages, status]) => ({
            Messages: messages.map(str => JSON.parse(str)),
            Status: status.map(str => JSON.parse(str))
        }));

        return Chat;

    } catch(error) {
        console.log('CustomerChat', error);
        return 500;
    }
}

export async function GetChats(UserId: string, ChatLength: number): Promise<number | object[]> {
    try {

        const RedisResult = await redis.con.sendCommand(['FCALL', 'chat_get_chats', '1', UserId, ChatLength.toString(), '15']) as string;
        const { RedisChats, offset, limit, exceptions } = JSON.parse(RedisResult);

        if(limit === 0) {
            return RedisChats;
        }

        const [[ MysqlChats ]] = await mysql.promise().query('CALL get_chats(?, ?, ?, ?)', [UserId, offset, limit, typeof exceptions === 'object' ? '' :  exceptions.toString()]) as any;
        const MergedChats = Array.isArray(RedisChats) ? RedisChats.concat(MysqlChats) : MysqlChats;

        return MergedChats;

    } catch(error) {

        console.log('GetChats', error);
        return 500;
    }
}

export async function GetMessages(Body: { MessageLength: number, ChatId: number }): Promise<number | object[]> {
    let Max = 15;
    let Messages: Message[] = [];

    try {

        const MessagesInRedisLength = await redis.con.lLen(('chat:?:messages').replace('?', Body.ChatId.toString()));
        if(MessagesInRedisLength > Body.MessageLength) {

            const MessagesInRedis = await redis.con.lRange(('chat:?:messages').replace('?', Body.ChatId.toString()), Body.MessageLength, Max);
            MessagesInRedis.forEach((StringMessage: string): void => {
                const Message = JSON.parse(StringMessage);
                Message.sent_at = new Date(Message.sent_at);
                Messages.push(Message);
            });
            
            if(MessagesInRedis.length === Max) {
                return Messages;
            }

            Max -= MessagesInRedis.length;
            Body.MessageLength = 0;

        } else {

            Body.MessageLength -= MessagesInRedisLength;
        }

        const [MessagesInMysql] = await mysql.promise().query('SELECT * FROM tbl_chat_messages  WHERE chat_id = ? ORDER BY sent_at DESC LIMIT ?, ?', [Body.ChatId, Body.MessageLength, Max]) as any;
        Messages = Messages.concat(MessagesInMysql);

        return Messages;

    } catch (error) {

        console.log('GetMessages', error);
        return 500;
    }
}