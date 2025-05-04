import { Request, Response, NextFunction } from 'express';
import { dropbox } from '../app';
import fs from 'fs';

export const DropboxUpload = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    if(req.file !== undefined) {

        try {

            await fs.promises.access(req.file.path);
            const response = await dropbox.connection.filesUpload({ path: '/chat-app/' + req.file.filename, contents: fs.readFileSync(req.file.path), mode: 'add' });
            const sharedLink = await dropbox.connection.sharingCreateSharedLinkWithSettings({ path: response.result.path_lower });

            req.body.MessageType = 'file';
            req.body.Message = sharedLink.result.url;
            fs.unlinkSync(req.file.path);

        } catch(error) {

            console.log('dropboxUpload', error);
            fs.unlinkSync(req.file.path);
            return res.sendStatus(500);
        }

    } else {
        req.body.MessageType = 'text';
    }

    return next();
};
