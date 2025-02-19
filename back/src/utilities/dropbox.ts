import { Request, Response, NextFunction } from 'express';
import fs from 'fs';

import { dropbox } from '../app';

export const dropboxUpload = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    req.body.contentType = 'text';
    if(req.file !== undefined) {
        
        try {

            await fs.promises.access(req.file.path);
            const response = await dropbox.connection.filesUpload({ path: '/chat-app/' + req.file.filename, contents: fs.readFileSync(req.file.path), mode: 'add' });
            const sharedLink = await dropbox.connection.sharingCreateSharedLinkWithSettings({ path: response.result.path_lower });

            req.body.contentType = 'file';
            req.body.content = sharedLink.result.url;
            fs.unlinkSync(req.file.path);

        } catch(error) {

            console.log(error);
            console.log("DROPBOX ERROR");
            fs.unlinkSync(req.file.path);
            return res.sendStatus(400);
        }
    }

    next();
};
