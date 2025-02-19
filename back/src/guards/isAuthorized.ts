import { Request, Response, NextFunction } from "express";

export const isAuthorized = (role: string) => (req: Request, res: Response, next: NextFunction): any => {
    const user = req.user as any;
    if(user.role !== role) 
        return res.sendStatus(401);

    next();
}
