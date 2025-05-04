import { Request, Response, NextFunction } from "express";
import { Referers } from "../utilities/referer";


export function UuidExtractor(req: Request, _: Response, next: NextFunction): void {
    const uuid = req.cookies['uuid'];
    if(uuid) {
        req.user = {
            id: uuid,
            role: 'customer',
            company: 'ibc'
        };
    }

    next();
}