import multer from 'multer';
import path from 'path';
import { tmp } from '../app';
import { v4 } from 'uuid';

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, tmp);
    },
    filename: (req, file, callback) => {
        const fileExtension = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + v4();
        callback(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
});

export const MulterUpload = multer({ storage: storage });
