import { Request, Response, NextFunction } from "express";
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from "../utilities/jwt";
import { cookieOptions } from "../app";

const referer = {
    'http://localhost:4200/':   'ibc',
    'http://localhost:3000/':   'ibc',
    'https://www.ibcauto.com':  'ibc'
}
export const AuthenticationExtractor = (req: Request, res: Response, next: NextFunction) => {

    const user: any = {};
    const atk = verifyAccessToken(req.cookies['atk']);
    if(!atk.token) {

        const rtk = verifyRefreshToken(req.cookies['rtk']);
        if(!rtk.token) {
            return next();
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