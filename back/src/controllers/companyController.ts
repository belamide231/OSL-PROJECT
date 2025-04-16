import { Router, Request, Response } from "express";
import { getActiveUsersInSpecificCompanyService, GetCompanyThemeForCustomer, getCompanyThemeService } from "../services/companyServices";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { User } from "../interfaces/user";
import { authenticationExtractor } from "../middlewares/authenticationExtractor";
import { v4 } from "uuid";
import { cookieOptions } from "../app";

export const companyController = Router();

companyController.post('/getCompanyTheme', isAuthenticated, async (req: Request, res: Response): Promise<any> => {
    const response: any = await getCompanyThemeService(req.user as User) as number | object;
    if(isFinite(response)) {
        return res.sendStatus(response);
    }
    return res.json(response);
});

companyController.post('/customer/company/theme', async (req: Request, res: Response): Promise<any> => {

    const Referers = {
        'https://www.ibcauto.com/': 'ibc',
    };
    
    const Company = req.headers.referer && Referers[req.headers.referer as keyof typeof Referers] ? Referers[req.headers.referer as keyof typeof Referers] : 'ibc';
    const Uuid = (() => {
        if(req.cookies['uuid']) {
            return req.cookies['uuid'];
        }
        const Uuid = v4();
        res.cookie('uuid', Uuid, cookieOptions);
        return Uuid;
    })();

    const Response: any = await GetCompanyThemeForCustomer(Uuid, Company, req.body);

    if(typeof Response === 'number') {
        return res.sendStatus(Response);
    }

    return res.json(Response);
});

companyController.post('/get/active/scoped/users', authenticationExtractor, async (req: Request, res: Response): Promise<any> => {

    const user = req.user as any;
    const result: any = await getActiveUsersInSpecificCompanyService(user.company, user.role) as any;
    if(typeof result === 'number') {
        return res.sendStatus(result);
    }

    result.filter((obj: any) => {
        if(obj.id === user.id) {
            return obj.name = 'You';
        }
    });

    return res.json(result);
});