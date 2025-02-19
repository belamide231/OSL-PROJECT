import { Level } from 'level';
import path from 'path';

export const getLevelConnection = () => {
    const connection = new Level(path.join(__dirname, '../../db'));
    return connection;
}