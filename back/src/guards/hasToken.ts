import { Request, Response, NextFunction } from "express";

export const hasToken = (req: Request, res: Response, next: NextFunction) => {

    if(req.cookies['rtk']) 
        return res.redirect('/');

    next();
}