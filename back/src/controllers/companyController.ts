import { Router, Request, Response } from "express";
import { getCompanyThemeForUnauthenticatedUsersService, getCompanyThemeService } from "../services/companyServices";
import { isAuthenticated } from "../guards/isAuthenticated";
import { User } from "../interfaces/user";
export const companyController = Router();

companyController.post('/getCompanyTheme', isAuthenticated, async (req: Request, res: Response): Promise<any> => {
    // PUN-AN TANIG MO RETURN UG UG DATA SA DATA SA USER
    const response: any = await getCompanyThemeService(req.user as User) as number | object;
    if(isFinite(response)) {
        return res.sendStatus(response);
    }

    return res.json(response);
});



companyController.post('/unauthenticated/company/theme', async (req: Request, res: Response): Promise<any> => {
    // Ani nga API, ari ta mag hatag ug data sa user

    const domains = {
        'localhost:3000': 'ibc',
        'localhost:4200': 'ibc',
        'www.ibcauto.com': 'ibc'
    };

    const domain = req.headers.host as keyof typeof domains;
    if(!domains[domain]) {
        return res.sendStatus(401);
    }

    req.body['sid'] = req.sessionID;
    
    const response: any = await getCompanyThemeForUnauthenticatedUsersService(req.sessionID, domains[domain], req.body);
    if(isFinite(response)) {
        return res.sendStatus(response);
    }

    return res.json(response);
});