import { Router, Request, Response } from "express";
import { companyServices } from "../services/companyServices";
import { isAuthenticated } from "../guards/isAuthenticated";
export const companyController = Router();
companyController


.post('/getCompanyTheme', isAuthenticated, async (req: Request, res: Response): Promise<any> => {
    const response = await companyServices((req.user as any).company);
    if(response.status !== 200)
        return res.sendStatus(response.status);

    return res.status(response.status).json(response.result);
});