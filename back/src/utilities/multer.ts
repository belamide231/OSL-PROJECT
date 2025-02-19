import multer from 'multer';
import path from 'path';
import { tmp } from '../app';

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, tmp);
    },
    filename: (req, file, callback) => {
        const fileExtension = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        callback(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
});

export const upload = multer({ storage: storage });
