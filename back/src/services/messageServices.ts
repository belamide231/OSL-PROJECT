import { mysql, io, redis } from "../app";
import { ChatPreservationTimer } from "../utilities/bullmq";
import { TimeStamp } from "../utilities/stamp";
import { MessageModel } from "../model/messageModel";
import { MessagesSqlConverter } from "../mysqlCalls/MessagesSql";
import { MemberSqlConverter } from "../mysqlCalls/MemberSql";


    /** chat:chat_id:status
     * 
     * @param {number} chat_id
     * 
     * Redis Key: `chat:{chat_id}:status`
     * Type: List
     * 
     * Value Type: JSON string 
        { 
           user_id:                   string,
           user_delivered_stamp:      string,
           user_seen_stamp:           string
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

export async function CreatingMessageService(NewMessage: MessageModel, ListOfMembers: string[], ChatType: string): Promise<object | number> {
    try {

        // Sa customer side, ang mo initiate ug conversation ang customer, so sa ato pa, mahibaw-an nato ang conversation if ever customer chat or authorize chat, which is mao na ang ilhanan nato, ug unsa na table atong migratan sa chat

        const MessageStored: string = await redis.con.sendCommand(['FCALL', 'create_message', '1', JSON.stringify(ListOfMembers), JSON.stringify(NewMessage)]);
        const MessageObject: {
            existing_in_db: boolean,
            new_message_object:         {
                message_id:                   number
                chat_id:                      number,
                sender_id:                    string,
                sent_at:                      string,
                message_type:                 string,
                message:                      string
            }
        } = JSON.parse(MessageStored);

        await ChatPreservationTimer(MessageObject.new_message_object.chat_id.toString(), ChatType);
    
        if(MessageObject.existing_in_db) {
            return 200;
        }

        const [[[query]]] = await mysql.promise().query('CALL creating_chat(?, ?, ?)', [MessageObject.new_message_object.chat_id, ListOfMembers.toString(), ChatType]) as any;
        if(query.status !== 200) {
            return 500;
        }

        return {
            ChatId: MessageObject.new_message_object.chat_id
        };

    } catch(error) {

        console.log('CreatingMessageService', error);
        return 500;
    }
}

export async function TransferPreservedData(ChatId: string, ChatType: string): Promise<void> {
    try {
        const PreservedChatData = await redis.con.sendCommand(['FCALL', 'chat_get', '1', ChatId]) as string;
        const ChatInformation = JSON.parse(PreservedChatData) as {
            status_list: [{ 
                user_id:                   string,
                user_delivered_stamp:      string,
                user_seen_stamp:           string
            }], 
            message_list: [{
                sender_id:                 string,
                message:                   string,
                message_type:              string,
                message_id:                number,
                chat_id:                   number,
                sent_at:                   string
            }]
        };

        // const SQL
        const MessagesSql: string = MessagesSqlConverter(ChatInformation.message_list, ChatType);
        const MemberSql: string = MemberSqlConverter(ChatInformation.status_list, ChatType, ChatId);

        console.log(MemberSql);

    } catch(error) {
        console.log('TransferPreservedData', error);
    }
}

export async function UpdateChatToSeen(UserId: string, ChatId: string): Promise<number> {
    try {

        const Stamp = TimeStamp();
        const MessageRead: string = await redis.con.sendCommand(['FCALL', 'chat_update_seen', '2', ChatId, UserId, Stamp]);
        if(MessageRead === 'Updated') {
            return 200;
        }
        return 404;

    } catch (error) {
        console.log('CreatingMessageService', error);
        return 500;
    }
}

export async function UpdateChatToDelivered(UserId: string): Promise<number> {
    try {
        
        const Stamp = TimeStamp();
        const ChatDelivered = await redis.con.sendCommand(['FCALL', 'chat_update_delivered', '1', UserId, Stamp]);
        console.log(ChatDelivered);

        return 200;

    } catch (error) {
        console.log('DeliveredMessageService', error);
        return 500;
    }
}