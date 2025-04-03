import { Router, Request, Response, static as static_, NextFunction } from "express";
import path from 'path';

import { isAuthenticated } from "../guards/isAuthenticated";
import { hasToken } from "../guards/hasToken";
import { isSignupValid } from "../guards/isSignupValid";
import { isInvited } from "../guards/isInvited";
import { isAuthorized } from "../guards/isAuthorized";
import { nextTick } from "process";

export const pageController = Router();

pageController.use(static_(path.join(__dirname, '../../public/pages/browser')));

pageController.get('/invite', isInvited);

// Page only for admin
pageController.get(['/', '/chat', '/users', '/notification', '/settings', '/profile'], isAuthenticated, isAuthorized('admin'), (req: Request, res: Response): any => {
    return res.sendFile(path.join(__dirname, '../../public/pages/browser/index.html'));
});

// Page only for account
pageController.get(['/achat', '/adashboard', '/anotifications', '/asettings', '/acontacts'], isAuthenticated, isAuthorized('account'), (req: Request, res: Response): void => {
    return res.sendFile(path.join(__dirname, '../../public/pages/browser/index.html'));
});

pageController.get(['/login', '/sign-up'], hasToken, (req: Request, res: Response): void => {
    return res.sendFile(path.join(__dirname, '../../public/pages/browser/index.html'));
});

pageController.get('/widget', (req: Request, res: Response) => {
    return res.sendFile(path.join(__dirname, '../../index.html'));
});