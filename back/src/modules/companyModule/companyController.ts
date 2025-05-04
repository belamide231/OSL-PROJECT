import { Router, Request, Response } from "express";
import { FetchUsers, FetchThemeForCustomer, FetchThemeForUsers } from "./companyServices";
import { isAuthenticated } from "../../middlewares/isAuthenticated";
import { UserInterface } from "./interfaces/user";
import { AuthenticationExtractor } from "../../middlewares/authenticationExtractor";
import { v4 } from "uuid";
import { cookieOptions } from "../../app";
import { Referers } from "../../utilities/referer";
import { isAuthorized } from "../../middlewares/isAuthorized";

export const CompanyController = Router();

CompanyController.post('/fetch/company/theme/forAuthorize', isAuthenticated, async (req: Request, res: Response): Promise<any> => {
    const User = req.user as UserInterface;

    if(User.role === 'admin')
        User.company = req.body.Company as string;

    const Result: any = await FetchThemeForUsers(User) as number | object;
    if(isFinite(Result)) 
        return res.sendStatus(Result);

    return res.json(Result);
});

CompanyController.post('/fetch/company/theme/forCustomer', async (req: Request, res: Response): Promise<any> => {
    
    const Company = req.headers.referer && Referers[req.headers.referer as keyof typeof Referers] ? Referers[req.headers.referer as keyof typeof Referers] : 'ibc';
    const Uuid = (() => {
        if(req.cookies['uuid']) {
            return req.cookies['uuid'];
        }
        const Uuid = v4();
        res.cookie('uuid', Uuid, cookieOptions);
        return Uuid;
    })();

    const Response: any = await FetchThemeForCustomer(Uuid, Company, req.body);

    if(typeof Response === 'number') {
        return res.sendStatus(Response);
    }

    return res.json(Response);
});

CompanyController.post('/fetch/company/authorities', AuthenticationExtractor, isAuthorized('admin'), async (req: Request, res: Response): Promise<any> => {
    const result = await FetchUsers(Referers[req.headers.referer as keyof typeof Referers]) as any;

    if(typeof result === 'number') {
        return res.sendStatus(result);
    }

    return res.json(result);
});