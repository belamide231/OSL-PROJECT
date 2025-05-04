import express, { urlencoded, json, CookieOptions } from 'express';
import MemoryStore from 'memorystore';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import dontenv from 'dotenv';
import path from 'path';
import http from 'http';
import cookieParser from 'cookie-parser';
import Chance from 'chance';
import fs from 'fs';
import { Server } from 'socket.io';

dontenv.config();

import { getMysqlConnection } from './configuration/mysql';
import { getRedisConnection } from './configuration/redis';
import { Connection } from './sockets/connection';
import { getLevelConnection } from './configuration/level';
import { refresher } from './configuration/refresher';
import { ChatController } from './modules/chatModule/chatController';
import { AccountController } from './modules/accountModule/accountController';
import { PageController } from './modules/pageModule/pageController';
import { WidgetController } from './modules/widgetModule/widgetController';
import { CompanyController } from './modules/companyModule/companyController';
import { GuardsController } from './modules/guardsModule/guardsController';

export const tmp = path.join(__dirname, '../tmp');
export const level = getLevelConnection();
export const mysql = getMysqlConnection();
export const redis = new getRedisConnection();
export const dropbox: any = {};
export const events: any = {};

fs.mkdirSync(tmp, { recursive: true });

const origin = process.env.CLOUD_HOST ? process.env.DNS : [
    'http://localhost:4200',
    'http://localhost:3000'
];

export const app = express();
const store = MemoryStore(session);
const server = http.createServer(app);
export const chance = new Chance();
export const io = new Server(server, {
    cors: {
        origin,
        methods: ['POST', 'GET'],
        credentials: true
    }
});

export const sids: Record<string, string> = {}
export const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 30 * 12 * 100,
    path: '/',
};

app.use(cookieParser());
app.use(json());
app.use(urlencoded({ 
    extended: true 
}));
app.use(cors({
    origin: origin,
    credentials: true
}));
app.set("trust proxy", 1);
app.use(session({ 
    secret: process.env.SESSION_SECRET ? process.env.SESSION_SECRET : 'secret',
    store: new store({
        checkPeriod: 86400000
    }),
    resave: false, 
    saveUninitialized: true, 
    cookie: { 
        secure: false 
    } 
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(PageController);
app.use(ChatController);
app.use(AccountController);
app.use(CompanyController);
app.use(WidgetController);
app.use(GuardsController);

refresher();
io.on('connection', Connection.ConnectionAuthenticator);    

(async () => {
    if(mysql && await redis.con.ping()) {
        server.listen(process.env.CLOUD_HOST ? process.env.PORT : 3000, async () => {
            
            // await redis.con.flushAll();
            console.log(`RUNNING ON PORT: ${process.env.CLOUD_HOST ? process.env.PORT : '3000'}`);
        });
    }
})();