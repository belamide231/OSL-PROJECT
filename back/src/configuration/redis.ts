import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';
import path from 'path';
import fs, { readFileSync } from 'fs';


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

            await this.con.connect();
            await this.functions();
            console.log(`CONNECTED TO REDIS ${process.env.CLOUD_BASE ? 'CLOUD' : 'LOCAL'}`);

        } catch (error) {

            console.log("REDIS ERROR");
            console.log(error);
            process.exit();
        }
    }

    private directory(file: string): string {
        const directory = path.join(__dirname, `../../scripts/${file}.lua`);
        return readFileSync(directory, 'utf-8');
    }

    private async functions() {

        // const data = [
        //     { content: 'HELLO WORLD!', senderId: 3, receiverId: 2 },
        //     { content: 'GOOD LUCK!', senderId: 1, receiverId: 3 },
        //     { content: 'CONGRATULATIONS!', senderId: 2, receiverId: 1 },
        //     { content: 'HAPPY BIRTDAY!', senderId: 1, receiverId: 2 },
        //     { content: 'LOVE YOURSELF!', senderId: 2, receiverId: 3 },
        //     { content: 'WEEKENDS!', senderId: 4, receiverId: 1 },
        //     { content: 'MERRY CHRISTMAS!', senderId: 1, receiverId: 2 },
        // ]

        // const stamp = new Date();
        // console.log(stamp);
        // console.log(`${stamp.getHours()}:${stamp.getMinutes()}`);
    
        await this.con.sendCommand(['FUNCTION', 'LOAD', 'REPLACE', this.directory('setMessageScript')]);
        // data.forEach(async (x: any) => await this.con.sendCommand(['FCALL', 'setMessage', '0', x.senderId.toString(), x.receiverId.toString(), JSON.stringify(x)]));

        await this.con.sendCommand(['FUNCTION', 'LOAD', 'REPLACE', this.directory('getMessageScript')]);
        // const result = await this.con.sendCommand(['FCALL', 'getMessage', '0', '1']) as any;
        // const object = result.map((x: any) => x.map((x: any) => JSON.parse(x)));
        // console.log(object);
    }
}