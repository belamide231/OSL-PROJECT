import { Router, Request, Response } from "express";
import { loginAccountDto } from "./dto/loginAccountDto";
import { createAccountService, getListOfAccounts, InviteToSignupService, loginAccountService } from "./accountServices";
import { cookieOptions } from "../../app";
import { isAuthenticated } from "../../middlewares/isAuthenticated";
import { isAuthorized } from "../../middlewares/isAuthorized";

export const AccountController = Router();

AccountController.post('/account/login', async (req: Request, res: Response): Promise<any> => {
    const response = await loginAccountService(req.body as loginAccountDto) as { rtk: string, role: string };
    if(typeof response === 'number' && isFinite(response)) {
        return res.sendStatus(response);
    } 
    res.cookie('rtk', response.rtk, cookieOptions);
    return res.json({ role: response.role });
});

AccountController.post('/account/logout', async (req: Request, res: Response): Promise<any> => {
    res.clearCookie('rtk');
    res.clearCookie('atk');
    return res.sendStatus(200);
});

AccountController.post('/account/invite', isAuthenticated, isAuthorized('admin'), async (req: Request, res: Response): Promise<any> => {
    const user = req.user as any;
    req.body.Company = user.company;
    req.body.Role = 'account';
    return res.sendStatus(await InviteToSignupService(req.body));
});

AccountController.post('/account/create', async (req: Request, res: Response): Promise<any> => {
    if(req.body.username.length < 8) {
        return res.status(404).json({ message: 'Username requires 8 characters or more!' });
    }
    if(req.body.password.length < 8) {
        return res.status(404).json({ message: 'Password requires 8 characters or more!' });
    }
    if(req.body.password !== req.body.verifyPassword) {
        return res.status(404).json({ message: 'Password did not match!' });
    }

    const result = await createAccountService(req.body) as any;
    if(result !== 200) {
        return res.status(result.status_code).json({ message: result.message });
    }

    return res.sendStatus(result); 
});

AccountController.post('/get/accounts', isAuthenticated, isAuthorized('admin'), async (req: Request, res: Response): Promise<any> => {
    const result = await getListOfAccounts((req.user as any).company);
    if(typeof result === 'number' && isFinite(result)) {;
        return res.sendStatus(result);
    }
    return res.json({ result });
});