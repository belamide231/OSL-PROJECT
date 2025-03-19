import { Router, Request, Response } from "express";
import { getCompanyThemeForUnauthenticatedService, getCompanyThemeService } from "../services/companyServices";
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

    const response: any = await getCompanyThemeForUnauthenticatedService(req.headers.host as string) as number | object;
    if(isFinite(response)) {
        return res.sendStatus(response);
    }

    return res.json(response);
});