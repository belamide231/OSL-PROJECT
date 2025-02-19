import { Router, Request, Response, static as static_ } from "express";
import path from 'path';

import { isAuthenticated } from "../guards/isAuthenticated";
import { hasToken } from "../guards/hasToken";
import { isSignupValid } from "../guards/isSignupValid";
import { isInvited } from "../guards/isInvited";
import { isAuthorized } from "../guards/isAuthorized";

export const pageController = Router();
pageController
.use(static_(path.join(__dirname, '../../public/pages/browser')));


pageController
.get('/invite', isInvited)
.get('/widget', (req: Request, res: Response) => {
    return res.sendFile(path.join(__dirname, '../../index.html'));
})
.get('/login', hasToken, (req: Request, res: Response): void => {
    return req.cookies['unauthorized'] ? res.clearCookie('unauthorized').status(401).sendFile(path.join(__dirname, '../../public/pages/browser/index.html')) : res.sendFile(path.join(__dirname, '../../public/pages/browser/index.html'));
})
.get(['/', '/chat', '/users', '/notification', '/settings', '/profile'], isAuthenticated, isAuthorized('admin'), (req: Request, res: Response): any => {
    return res.status(200).sendFile(path.join(__dirname, '../../public/pages/browser/index.html'));
});
