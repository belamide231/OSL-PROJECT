import { Router, Request, Response } from "express";
import { loginAccountDto } from "../dto/accountController/loginAccountDto";
import { createAccountDTO } from "../dto/accountController/createAccountDto";
import { createAccountService, inviteToSignupService, loginAccountService, logoutAccountService } from "../services/accountServices";
import { cookieOptions } from "../app";
import { inviteToSignupDto } from "../dto/accountController/inviteToSignupDto";
export const accountController = Router();
accountController


.post('/invite', async (req: Request, res: Response): Promise<any> => {
    return res.sendStatus(await inviteToSignupService(req.body as inviteToSignupDto));
})


.post('/loginAccount', async (req: Request, res: Response): Promise<any> => {
    const response = await loginAccountService(req.body as loginAccountDto) as any;
    return response.status !== 200 ? res.sendStatus(response.status) : res.cookie('rtk', response.rtk, cookieOptions).sendStatus(response.status);
})


.post('/logoutAccount', async (req: Request, res: Response): Promise<any> => {
    const status = await logoutAccountService(req.sessionID);
    return status !== 200 ? res.sendStatus(status) : res.clearCookie('rtk').clearCookie('atk').sendStatus(status);
})


.post('/createAccount', async (req: Request, res: Response): Promise<any> => {
    return res.sendStatus(await createAccountService(req.body as createAccountDTO)); 
})