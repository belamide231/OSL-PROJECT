import { Request, Response } from "express";
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from "./jwt";
import { cookieOptions } from "../app";

export const rotateToken = (req: Request, res: Response): boolean => {

    if(verifyAccessToken(req.cookies['atk']).token) 
        return true;

    const decode = verifyRefreshToken(req.cookies['rtk']);
    if(!decode.token) 
        return false;

    const payload = decode.payload as any;
    res.cookie('atk', generateAccessToken(req.sessionID, payload.sub, payload.name, payload.company, payload.role, payload.picture), cookieOptions);
    res.cookie('rtk', generateRefreshToken(payload.sub, payload.name, payload.company, payload.role, payload.picture), cookieOptions);

    return true;
}