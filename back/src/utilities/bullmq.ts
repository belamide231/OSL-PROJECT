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


export const setCachedTimer = async (data: { chatKey: string, users: number[] }) => {
    const removeExists = await queue.getJob(data.chatKey);

    removeExists && await removeExists.remove();

    await queue.add('chat', { 
        data 
    }, {
        delay: 1000 * 60 * 60,
        jobId: data.chatKey
    });
}


new Worker('chats', async (job) => {
    await migrateCachedMessages(job.data.data);
}, connection);