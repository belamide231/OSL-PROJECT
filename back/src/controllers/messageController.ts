import { Router, Request, Response } from "express";

import { CreatingMessageService, UpdateChatToDelivered, getActiveClientsService, UpdateChatToSeen } from "../services/messageServices";
import { sendMessageDto } from "../dto/messageController/sendMessageDto";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { upload } from "../utilities/multer";
import { dropboxUpload } from "../utilities/dropbox";
import { loadMessageDto } from "../dto/messageController/loadMessageDto";
import { User } from "../interfaces/user";
import { authenticationExtractor } from "../middlewares/authenticationExtractor";
import { MessageModel } from "../model/messageModel";
import { TimeStamp } from "../utilities/stamp";
import { UNSAFE_useRouteId } from "react-router-dom";
import { isEqualsGreaterThanToken } from "typescript";

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

export const messageController = Router();


messageController.post('/chat/create/message', authenticationExtractor, async (req: Request, res: Response): Promise<any> => {

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

    let ChatType: null | string = null;

    const UserId: string = ((): string => {
        const User = req.user as any;
        if(User) {
            ChatType = 'Authorize';
            return User.id.toString();
        }
        ChatType = 'Customer';
        return req.cookies['uuid'];
    })();

    if(!UserId || !req.body.MessageReceiversId) {
        return res.sendStatus(422);
    }

    const NewMessage: MessageModel = {
        message_id: null,
        chat_id: req.body.ChatId,
        sender_id: UserId,
        sent_at: TimeStamp(),
        message_type: 'text',
        message: req.body.Message
    };

    const ListOfMembers = req.body.MessageReceiversId.concat([UserId]);

    const Result: any = await CreatingMessageService(NewMessage, ListOfMembers, ChatType);

    if(typeof Result === 'number') {

        if(Result !== 200) {
            return res.sendStatus(Result);
        }
        return res.json({ MessageUuid: req.body.MessageUuid });
    }
    
    Result.MessageUuid = req.body.MessageUuid;
    return res.status(200).json(Result);
});


messageController.post('/chat/seen/:chat_id', authenticationExtractor, async(req: Request, res: Response): Promise<any> => {

    /** 
     * @param {number} chat_id
     * 
     * @path /chat/read/42
     */

    const ChatId = req.params.chat_id;
    if(!ChatId) {
        return res.sendStatus(422);
    }

    const UserId: string = ((): string => {
        const User = req.user as any;
        if(User) {
            return User.id.toString();
        }
        return req.cookies['uuid'];
    })();

    if(!UserId) {
        return res.sendStatus(401);
    }

    const Result: number = await UpdateChatToSeen(UserId, ChatId);
    return res.sendStatus(Result);
});


messageController.post('/chat/delivered', authenticationExtractor, async(req: Request, res: Response): Promise<any> => {
    const UserId: string = ((): string => {
        const User = req.user as any;
        if(User) {
            return User.id.toString();
        }
        return req.cookies['uuid'];
    })();

    if(!UserId) {
        return res.sendStatus(401);
    }

    const Result: any = await UpdateChatToDelivered(UserId);
    return res.sendStatus(Result);
})