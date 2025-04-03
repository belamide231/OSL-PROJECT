import { Router, Request, Response } from "express";
import { loginAccountDto } from "../dto/accountController/loginAccountDto";
import { createAccountDTO } from "../dto/accountController/createAccountDto";
import { createAccountService, inviteToSignupService, loginAccountService, logoutAccountService } from "../services/accountServices";
import { cookieOptions } from "../app";
import { isAuthenticated } from "../guards/isAuthenticated";
import { isAuthorized } from "../guards/isAuthorized";
export const accountController = Router();


accountController.post('/loginAccount', async (req: Request, res: Response): Promise<any> => {
    const response = await loginAccountService(req.body as loginAccountDto) as { rtk: string, role: string };

    if(typeof response === 'number' && isFinite(response)) {
        return res.sendStatus(response);
    } 
    res.cookie('rtk', response.rtk, cookieOptions);
    return res.json({ role: response.role });
});


accountController.post('/logoutAccount', async (req: Request, res: Response): Promise<any> => {
    const status = await logoutAccountService(req.sessionID);
    return status !== 200 ? res.sendStatus(status) : res.clearCookie('rtk').clearCookie('atk').sendStatus(status);
});


accountController.post('/invite', isAuthenticated, isAuthorized('admin'), async (req: Request, res: Response): Promise<any> => {
    req.body.domain = req.headers.origin;
    req.body.role = 'account';
    return res.sendStatus(await inviteToSignupService(req.body));
});


accountController.post('/createAccount', async (req: Request, res: Response): Promise<any> => {
    req.body.sid = req.sessionID;
    return res.sendStatus(await createAccountService(req.body as createAccountDTO)); 
});