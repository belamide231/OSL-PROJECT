import { Router, Request, Response, static as static_, NextFunction } from "express";
import path from 'path';

import { isAuthenticated } from "../middlewares/isAuthenticated";
import { hasToken } from "../middlewares/hasToken";
import { isSignupValid } from "../middlewares/isSignupValid";
import { IsInvited } from "../middlewares/isInvited";
import { isAuthorized } from "../middlewares/isAuthorized";
import { authenticationExtractor } from "../middlewares/authenticationExtractor";

export const pageController = Router();

pageController.use(static_(path.join(__dirname, '../../public/pages/browser')));

pageController.get(['/', '/chat', '/users', '/notification', '/settings', '/profile'], (req: Request, res: Response): any => {
    return res.sendFile(path.join(__dirname, '../../public/pages/browser/index.html'));
});

pageController.get(['/achat', '/adashboard', '/anotifications', '/asettings', '/acontacts'], (req: Request, res: Response): void => {
    return res.sendFile(path.join(__dirname, '../../public/pages/browser/index.html'));
});

pageController.get(['/login'], hasToken, (req: Request, res: Response): void => {
    return res.sendFile(path.join(__dirname, '../../public/pages/browser/index.html'));
});

pageController.get(['/signup'], hasToken, IsInvited, (req: Request, res: Response): void => {
    return res.sendFile(path.join(__dirname, '../../public/pages/browser/index.html'));
});

pageController.get('/widget', (req: Request, res: Response) => {
    return res.sendFile(path.join(__dirname, '../../index.html'));
});