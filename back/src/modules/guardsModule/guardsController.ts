import { Router, Request, Response } from "express";
import { verifyInvitationToken } from "../../utilities/jwt";
import { isAuthenticated } from "../../middlewares/isAuthenticated";
import { AuthenticationExtractor } from "../../middlewares/authenticationExtractor";

export const GuardsController = Router();

GuardsController.post('/user/invitation/proof', (req: Request, res: Response): any => {
    const result = verifyInvitationToken(req.body.Invitation);
    if(!result) {
        return res.sendStatus(401);
    }
    return res.sendStatus(200);
});

GuardsController.post('/user/authentication/proof', isAuthenticated, (_: Request, res: Response): any => {
    return res.sendStatus(200);
});

GuardsController.post('/user/authorization/proof', AuthenticationExtractor, (req: Request, res: Response): any => {
    const RoleRequired: string = req.body.RoleRequired as string;
    const User: any = req.user as any;

    if(!RoleRequired) {
        return res.sendStatus(422);
    }
    if(RoleRequired !== User.role) {
        return res.sendStatus(401);
    }

    return res.sendStatus(200);
});

GuardsController.post('/user/hasKey', AuthenticationExtractor, (req: Request, res: Response): any => {
    const user = req.user as any;
    if(!req.user) {
        return res.status(200).json();
    }

    const role = user.role;
    if(['admin', 'account'].includes(role)) {
        return res.status(403).json({ role: role });
    }

    return res.status(200).json();
});