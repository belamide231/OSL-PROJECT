import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

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
            console.log(`CONNECTED TO REDIS ${process.env.CLOUD_BASE ? 'CLOUD' : 'LOCAL'}`);
        } catch (error) {

            console.log("REDIS ERROR");
            console.log(error);
            process.exit();
        }
    }
}