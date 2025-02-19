import { Request, Response } from "express";

import { verifyInvitationToken } from "../utilities/jwt";
import { redis } from "../app";

export const isInvited = async (req: Request, res: Response): Promise<any> => {

    const invitation = req.query['invitation'] as string;
    if(!invitation)
        return res.sendStatus(401);

    const decoded = verifyInvitationToken(invitation);
    if(!decoded['token']) 
        return res.sendStatus(401);

    const payload = decoded['payload'] as any;
    const redisData = await redis.con.get('db2:' + payload.email);


    if(redisData === null) {

        const data = {
            role: payload.role,
            email: payload.email,
            company: payload.company
        }

        const sid = req.sessionID;

        try {

            await redis.con.set('db2:' + payload.email, JSON.stringify(data), { EX: 60 * 60 });
            await redis.con.set('db3:' + sid, 'db2:' + payload.email, { EX: 60 * 60 });

        } catch {

            return res.sendStatus(500);
        }

    } 

    return res.redirect('/sign-up');
}