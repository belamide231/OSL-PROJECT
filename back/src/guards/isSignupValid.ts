import { Request, Response, NextFunction } from "express";
import { redis } from "../app";

export const isSignupValid = async (req: Request, res: Response, next: NextFunction): Promise<any> => {

    if(req.cookies['rtk']) 
        return res.redirect('/');

    const email = await redis.con.get('db3:' + req.sessionID);
    if(email === null)  
        return res.redirect('/login');

    const data = await redis.con.get(email);
    if(data === null)
        return res.redirect('/login');

    next();
}