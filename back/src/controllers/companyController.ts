import { Router, Request, Response } from "express";
import { getActiveAccountsInSpecificCompanyService, getCompanyThemeForUnauthenticatedUsersService, getCompanyThemeService } from "../services/companyServices";
import { isAuthenticated } from "../guards/isAuthenticated";
import { User } from "../interfaces/user";
export const companyController = Router();


const domains = {
    'localhost:3000':   'ibc',
    'localhost:4200':   'ibc',
    'www.ibcauto.com':  'ibc'
};


companyController.post('/getCompanyTheme', isAuthenticated, async (req: Request, res: Response): Promise<any> => {

    const response: any = await getCompanyThemeService(req.user as User) as number | object;
    if(isFinite(response)) {
        return res.sendStatus(response);
    }

    return res.json(response);
});


companyController.post('/unauthenticated/company/theme', async (req: Request, res: Response): Promise<any> => {

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


companyController.post('/get/active/accounts', async (req: Request, res: Response): Promise<any> => {

    const domain = req.headers.host as keyof typeof domains;
    const result: any = await getActiveAccountsInSpecificCompanyService(domain) as number | null | string;

    if(typeof result === 'number') {
        return res.sendStatus(result);
    }

    return res.json(result);
});