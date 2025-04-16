import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, verifyRefreshToken } from "../utilities/jwt";



export const hasToken = async (req: Request, res: Response, next: NextFunction) => {

    const atk = verifyAccessToken(req.cookies['atk']) as any;
    if(!atk.token) {

        const rtk = verifyRefreshToken(req.cookies['rtk']) as any;
        if(!rtk.token) {

            return next();
        }

        return res.redirect(({ 'admin': '/', 'account': '/adashboard' } as any)[rtk.payload.role]);
    }

    return res.redirect(({ 'admin': '/', 'account': '/adashboard' } as any)[atk.payload.role]);
}