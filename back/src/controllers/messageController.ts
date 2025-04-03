import { Router, Request, Response } from "express";

import { getActiveClientsService, sendMessageService, loadChatListServices, loadMessageService, loadMoreMessagesService } from "../services/messageServices";
import { sendMessageDto } from "../dto/messageController/sendMessageDto";
import { isAuthenticated } from "../guards/isAuthenticated";
import { upload } from "../utilities/multer";
import { dropboxUpload } from "../utilities/dropbox";
import { loadMessageDto } from "../dto/messageController/loadMessageDto";
import { User } from "../interfaces/user";
import { authenticationExtractor } from "../middlewares/authenticationExtractor";


export const messageController = Router();


messageController.post('/getActiveClients', authenticationExtractor, async (req: Request, res: Response): Promise<any> => {
    const user = req.user as any;

    const response = await getActiveClientsService(user.role, user.company);
    if(typeof response === 'number' && isFinite(response)) {
        return res.sendStatus(response);
    }
    return res.json(response);
});


messageController.post('/sendMessage', isAuthenticated, upload.single('file'), dropboxUpload, async (req: Request, res: Response): Promise<any> => {
    const response = await sendMessageService((req.user as any).id, req.body as sendMessageDto) as any;
    if(isFinite(response)) {
        return res.sendStatus(response);
    }
    return res.json(response);
});


messageController.post('/loadMessage', isAuthenticated, async (req: Request, res: Response): Promise<any> => {
    const response = await loadMessageService(req.body as loadMessageDto, (req.user as any).id, (req.user as any).name) as any;
    if(isFinite(response)) {
        return res.sendStatus(response);
    }
    return res.json(response);
});


messageController.post('/loadChatList', isAuthenticated, async (req: Request, res: Response): Promise<any> => {
    const response: any = await loadChatListServices(req.user as User, req.body.chatListLength) as any;
    if(typeof response === 'number' && isFinite(response)) {
        return res.sendStatus(response);
    }
    return res.json(response);
});


messageController.post('/loadMoreMessages', isAuthenticated, async (req: Request, res: Response): Promise<any> => {

    interface RequestDTO {
        chatmateId:                     number,
        lengthOfExistingMessages:       number
    }

    const body = req.body as RequestDTO;
    const response: any = await loadMoreMessagesService(req.user as User, body) as number | object[];

    if(isFinite(response) && !Array.isArray(response)) {
        return res.sendStatus(response);
    }

    return res.json(response);
});