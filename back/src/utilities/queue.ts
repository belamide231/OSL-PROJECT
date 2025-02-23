import { Queue, Worker } from 'bullmq';
import { migrateCachedMessages } from '../services/messageServices';
import dotenv from 'dotenv';
dotenv.config();


const connection = {
    connection: { 
        url: process.env.CLOUD_BASE ? process.env.REDIS_URL as string : 'redis://localhost:6379/0'
    }
};


const queue = new Queue('chats', connection);


export const setTimer = async (chatId: string) => {
    const existsTimer = await queue.getJob(chatId);

    existsTimer && await existsTimer.remove();

    await queue.add('chat', { 
        chatId 
    }, {
        delay: 1000 * 60 * 60,
        jobId: chatId
    });
}


new Worker('chats', async (job) => {
    await migrateCachedMessages(job.data.chatId);
}, connection);