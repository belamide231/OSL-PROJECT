import { TransferPreservedData } from '../services/messageServices';
import { Queue, Worker } from 'bullmq';
import dotenv from 'dotenv';
dotenv.config();


const Connection = {
    connection: { 
        url: process.env.CLOUD_BASE ? process.env.REDIS_URL as string : 'redis://localhost:6379/0'
    }
};

const Queues = new Queue('chat_preservation_timer', Connection);


export async function ChatPreservationTimer(ChatId: string, ChatType: string): Promise<void> {
    const JobId = `chat_id:${ChatId}`;
    const ActivatedJob = await Queues.getJob(JobId);

    if(ActivatedJob) {
        await ActivatedJob.remove();
    }

    await Queues.add('chat_information', {
        ChatId,
        ChatType
    }, {
        delay: 1000*5,
        jobId: JobId 
    });
}


new Worker('chat_preservation_timer', async (Job): Promise<void> => await TransferPreservedData(Job.data.ChatId, Job.data.ChatType), Connection);