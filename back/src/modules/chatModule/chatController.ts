import { Router, Request, Response } from "express";
import { CreatingMessageService, GetMessages, GetChats, CustomerChat, FetchActives, FetchUsers } from "./chatServices";
import { AuthenticationExtractor } from "../../middlewares/authenticationExtractor";
import { MessageModel } from "./models/messageModel";
import { TimeStamp } from "../../utilities/stamp";
import { DropboxUpload } from "../../utilities/dropbox";
import { MulterUpload } from "../../utilities/multer";
import { UuidExtractor } from "../../middlewares/uuidExtractor";
import { Customer } from "./interfaces/customer";
import { Authorize } from "./interfaces/authorize";
import { isAuthenticated } from "../../middlewares/isAuthenticated";
import { Referers } from "../../utilities/referer";

export const ChatController = Router();

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

/**@mo_puli */
ChatController.post('/chat/fetch/users', AuthenticationExtractor, UuidExtractor, async (req: Request, res: Response): Promise<any> => {
    const User = req.user as Authorize | Customer;
    if(!User) 
        return res.sendStatus(401);

    if(!User.company && User.role === 'customer')
        User.company = Referers[req.headers.referer as keyof typeof Referers];

    let Result = await FetchUsers(User.role, User.company);

    if(typeof Result === 'number')
        return res.sendStatus(Result);

    if(User.role === 'customer')
        return res.json(Result);

    Result = (() => {
        const UserIndex = Result.findIndex((Authority: any) => Authority.id === User.id);
        const ContainedUser = Result[UserIndex];

        Result.splice(UserIndex, 1);
        return [{ ...ContainedUser, name: 'You' }, ...Result];
    })();

    return res.json(Result);
});

/**@ili_sanan */
ChatController.post('/chat/fetch/actives', AuthenticationExtractor, UuidExtractor, async (req: Request, res: Response): Promise<any> => {
    const User = req.user as Authorize | Customer;
    if(!User.company)
        User.company = req.headers.referer && Referers[req.headers.referer as keyof typeof Referers] ? Referers[req.headers.referer as keyof typeof Referers] : 'ibc';

    const Result = await FetchActives(User.role, User.company);

    if(typeof Result === 'number') 
        return res.sendStatus(Result);

    if(User.role !== 'customer')
        Result.filter((element: any) => element.id === User.id ? element.name = 'You' : element.name = element.name);

    return res.json(Result);
});

ChatController.post('/chat/create/message', MulterUpload.single('File'), DropboxUpload, AuthenticationExtractor, UuidExtractor, async (req: Request, res: Response): Promise<any> => {
    const User = req.user as Authorize | Customer;
    /** 
     * @body
        {
            "ChatId": null,
            "MessageReceiversId": ["2"],
            "Message": "Hello World!",
            "MessageUuid": "123"
        }     
     * @interface
        {
            "ChatId": number | null,
            "MessageReceiversId": string[],
            "Message": string,
            "MessageUuid": string
        }
     */
    
    if(!User || !User.id) 
        return res.sendStatus(422);

    if(!req.body.Message) 
        return res.sendStatus(400);

    const NewMessage: MessageModel = {
        message_id: null,
        chat_id: JSON.parse(req.body.ChatId),
        sender_id: User.id,
        sender: User.role === 'customer' ? 
            User.id : 
            (User as Authorize).name,
        sent_at: TimeStamp(),
        message_type: req.body.MessageType,
        message: req.body.Message,
    };

    const Members = Array.isArray(req.body.MessageReceiversId) ? 
        req.body.MessageReceiversId.concat([User.id]) :
        JSON.parse(req.body.MessageReceiversId).concat([User.id]);

    const Result: any = await CreatingMessageService(NewMessage, Members, User.role === 'customer');

    if(typeof Result === 'number') {
        return Result !== 200 ?
            res.sendStatus(Result) :
            res.json({ MessageUuid: req.body.MessageUuid });
    }
    
    Result.MessageUuid = req.body.MessageUuid;
    return res.status(200).json(Result);
});

ChatController.post('/chat/customer/initials', UuidExtractor, async(req: Request, res: Response): Promise<any> => {
    const User = req.user as Authorize | Customer;

    if(!User || !User.id) {
        return res.sendStatus(401);
    }

    const Result = await CustomerChat(User.id);
    if(typeof Result === 'number') {
        return res.sendStatus(Result);
    }

    return res.json(Result);
});

ChatController.post('/chat/authenticated/initials', isAuthenticated, async(req: Request, res: Response): Promise<any> => {
    const Result = await GetChats((req.user as any).id, 0);
    
    if(typeof Result === 'number') {
        return res.sendStatus(Result);
    }

    return res.json(Result);
});

ChatController.post('/chat/load/chats', AuthenticationExtractor, UuidExtractor, async(req: Request, res: Response): Promise<any> => {
    const User = req.user as Authorize | Customer;

    if(!User || !User.id) {
        return res.sendStatus(401);
    }

    if(req.body.ChatLength === undefined) {
        return res.sendStatus(422);
    }

    const ChatLength = req.body.ChatLength as number;
    const Result = await GetChats(User.id, ChatLength);
    
    if(typeof Result === 'number') {
        return res.sendStatus(Result);
    }

    return res.json(Result);
});

ChatController.post('/chat/load/messages', AuthenticationExtractor, UuidExtractor, async(req: Request, res : Response): Promise<any> => {
    const User = req.user as Authorize | Customer;

    if(!User || !User.id) {
        return res.sendStatus(401);
    }

    const Body = req.body as {
        MessageLength: number;
        ChatId: number;
    }

    if(!Body) {
        return res.sendStatus(422);
    }

    const Result = await GetMessages(Body);

    if(typeof Result === 'number') {
        return res.sendStatus(Result);
    }

    return res.json(Result);
});