import { Router, Request, Response } from "express";

import { getActiveClientsService, sendMessageService, loadChatListServices, loadMessageService, loadMessagesService } from "../services/messageServices";
import { sendMessageDto } from "../dto/messageController/sendMessageDto";
import { getConversationDto } from "../dto/messageController/getConversationDto";
import { isAuthenticated } from "../guards/isAuthenticated";
import { upload } from "../utilities/multer";
import { dropboxUpload } from "../utilities/dropbox";
import { loadMessageDto } from "../dto/messageController/loadMessageDto";
import { User } from "../interfaces/user";


export const messageController = Router();
messageController


.post('/getActiveClients', isAuthenticated, async (req: Request, res: Response): Promise<any> => {
    const response = await getActiveClientsService((req.user as any).role);
    return response.status !== 200 ? res.sendStatus(response.status) : res.status(200).json(response.result);
})


.post('/sendMessage', isAuthenticated, upload.single('file'), dropboxUpload, async (req: Request, res: Response): Promise<any> => {
    const response = await sendMessageService((req.user as any).id, req.body as sendMessageDto) as any;
    return isFinite(response) ? res.sendStatus(response) : res.json(response);
})


.post('/loadMessage', isAuthenticated, async (req: Request, res: Response): Promise<any> => {
    const response = await loadMessageService(req.body as loadMessageDto, (req.user as any).id, (req.user as any).name) as any;
    return isFinite(response) ? res.sendStatus(response) : res.json(response);
})


.post('/loadChatList', isAuthenticated, async (req: Request, res: Response): Promise<any> => {
    const response = await loadChatListServices(req.user as User, req.body.chatListLength) as any;
    return isFinite(response as number) ? res.sendStatus(response as number) : res.json(response);
})


.post('/loadMessages', isAuthenticated, async (req: Request, res: Response): Promise<any> => {
    const response = await loadMessagesService((req.user as any).id, req.body as getConversationDto);
    return response.status !== 200 ? res.sendStatus(response.status) : res.status(200).json(response.result);
})


