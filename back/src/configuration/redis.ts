import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';


dotenv.config();


export class getRedisConnection {
    public con: RedisClientType;

    constructor() {

        let url = 'redis://localhost:6379/0';
        if(process.env.CLOUD_BASE)
            url = process.env.REDIS_URL as string;

        this.con = createClient({ url });
        this.initialize();
    }

    private async initialize() {

        try {

            const scriptPath = path.join(__dirname, '../../scripts');
            const getMessageScript = fs.readFileSync(path.join(scriptPath, 'getMessages.lua'), 'utf-8') as string;

            await this.con.connect();
            await this.con.sendCommand(['FUNCTION', 'LOAD', 'REPLACE', getMessageScript]);

            const result = await this.con.sendCommand(['FCALL', 'getMessages', '0', '1', '3']) as any;
            const found = result[0];
            const messages = result[1].map((x: string) => JSON.parse(x));

            console.log(messages);

            console.log(`CONNECTED TO REDIS ${process.env.CLOUD_BASE ? 'CLOUD' : 'LOCAL'}`);

        } catch (error) {

            console.log("REDIS ERROR");
            console.log(error);
            process.exit();
        }
    }
}