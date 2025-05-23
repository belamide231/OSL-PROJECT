import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const directory = (files: string[]): string => {

    let script = fs.readFileSync(path.join(__dirname, `../../scripts/@format.lua`), 'utf-8');

    files.forEach(file => {
        const fileContent = fs.readFileSync(path.join(__dirname, `../../scripts/${file}.lua`), 'utf-8').trim();
        script += `\n\n${fileContent}`;
    });
    
    return script;
}


export class getRedisConnection {
    public con: RedisClientType;

    constructor() {

        let url = 'redis://localhost:6379/0';
        if(process.env.CLOUD_BASE) {
            url = process.env.REDIS_URL as string;
        }

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

    private async functions() {

        const functions = [
            'message/create',
            'chat/update/delivered',
            'chat/update/chat_delivered',
            'chat/update/seen',
            'chat/get/chats',
            'chat/get/chat',
            'active/insert'
        ];

        const filePath = path.join(__dirname, '../../scripts/@all_functions.lua');
        fs.existsSync(filePath) && fs.unlinkSync(filePath);
        fs.writeFileSync(filePath, directory(functions));

        // FUNCTION LIST
        const AreFunctionsRegistered = await this.con.sendCommand(['FUNCTION', 'LOAD', 'REPLACE', directory(functions)]);
    }
}