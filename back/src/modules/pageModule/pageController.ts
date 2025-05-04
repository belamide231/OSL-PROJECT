import { Router, Request, Response, static as static_ } from "express";
import path from 'path';

import { hasToken } from "../../middlewares/hasToken";
import { IsInvited } from "../../middlewares/isInvited";


export const PageController = Router();

PageController.use(static_(path.join(__dirname, '../../public/pages/browser')));

PageController.get(['/', '/chat', '/users', '/notification', '/settings', '/profile'], (req: Request, res: Response): any => {
    return res.sendFile(path.join(__dirname, '../../public/pages/browser/index.html'));
});

PageController.get(['/achat', '/adashboard', '/anotifications', '/asettings', '/acontacts'], (req: Request, res: Response): void => {
    return res.sendFile(path.join(__dirname, '../../public/pages/browser/index.html'));
});

PageController.get(['/login'], hasToken, (req: Request, res: Response): void => {
    return res.sendFile(path.join(__dirname, '../../public/pages/browser/index.html'));
});

PageController.get(['/signup'], hasToken, IsInvited, (req: Request, res: Response): void => {
    return res.sendFile(path.join(__dirname, '../../public/pages/browser/index.html'));
});

PageController.get('/widget', (req: Request, res: Response) => {
    return res.sendFile(path.join(__dirname, '../../index.html'));
});