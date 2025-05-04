import { Router, Request, Response, static as static_ } from "express";
import { v4 } from 'uuid';
import path from "path";
import { cookieOptions } from "../../app";
import { rotateToken } from "../../utilities/tokenRotation";

export const WidgetController = Router();
WidgetController
.use(static_(path.join(__dirname, '../../public/widget/browser')));

const validDomains = [
    'http://localhost:3000',
    'http://www.ibcauto.com'
];

WidgetController
.get('/widget/chat', (req: Request, res: Response): any => {
    if(!rotateToken(req, res)) 
        res.cookie('sid', v4(), cookieOptions);
    
    return validDomains.some(x => req.headers.referer?.includes(x)) ? res.sendFile(path.join(__dirname, '../../public/widget/browser/index.html')) : res.redirect('/login');
})