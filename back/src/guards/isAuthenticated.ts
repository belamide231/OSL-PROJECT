import { Request, Response, NextFunction } from "express";

import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from "../utilities/jwt";
import { cookieOptions, redis } from "../app";

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction): Promise<any> => {

    const user: any = {};
    const atk = verifyAccessToken(req.cookies['atk']);
    if(!atk.token) {

        const rtk = verifyRefreshToken(req.cookies['rtk']);
        if(!rtk.token) {

            res.clearCookie('atk').clearCookie('rtk');

            if(req.method === 'POST')
                return res.sendStatus(401);

            res.cookie('unauthorized', true);
            return res.redirect('/login');
        }
    
        const sid = req.sessionID;
        const payload = rtk.payload as any;
        const refreshToken = generateRefreshToken(payload.sub, payload.name, payload.company, payload.role, payload.picture);
        const accessToken = generateAccessToken(sid, payload.sub, payload.name, payload.company, payload.role, payload.picture);
        payload.id = payload.sub;
    
        res.cookie('rtk', refreshToken, cookieOptions).cookie('atk', accessToken, cookieOptions);
        
        user['id'] = payload.sub;
        user['name'] = payload.name;
        user['company'] = payload.company;
        user['role'] = payload.role;
        user['picture'] = payload.picture;

        delete payload.sub;
        delete payload.iat;
        delete payload.exp;
        delete payload.iss;
        delete payload.aud;
        
        try {
    
            await redis.con.set(sid, JSON.stringify(payload), { EX: 60 * 60 });
    
        } catch {

            return res.status(500).redirect('/login');
        } 
    
    } else {

        const payload = atk.payload as any;
        user['id'] = payload.sub;
        user['name'] = payload.name;
        user['company'] = payload.company;
        user['role'] = payload.role;
        user['picture'] = payload.picture;
    }

    req.user = user;
    next();
}