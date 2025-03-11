import { io, socketClients } from "../app";
import { socketUser } from "../interfaces/socketUser";
import { editingAllTheChatStatusToDeliveredService, editingTheMessageStatusToDeliveredService, seenChatService } from "../services/messageServices";


export const updatingTheChatStatusToSeen = async (receiverId: number, senderId: number): Promise<void> => {

    // USER-ID WILL MARK THE CHATMATES MESSAGES AS SEEN

    const result = await seenChatService(receiverId, senderId) as any;
    if(isFinite(result)) {
        return;
    }

    // DIRECTED TO SENDER
    result['receiverId'] = receiverId;
    const senderConnection = socketClients.clientConnections[senderId];
    if(senderConnection) {
        io.to(senderConnection).emit('notifySenderThatChatIsBeingSeen', result);
    }
}


export const editingTheChatStatusToDelivered = async (receiverId: number, senderId: number): Promise<void> => {
    const result: any = await editingTheMessageStatusToDeliveredService(receiverId, senderId) as number | { updated: boolean, stamp: Date };
    if(typeof result === 'number' && isFinite(result)) {
        return;
    }

    const senderConnection = socketClients.clientConnections[senderId];
    io.to(senderConnection).emit('notifySenderThatTheMessageIsBeingDelivered', { receiverId, stamp: result.stamp });
}

export const editingAllTheChatStatusToDelivered = async (receiver: number): Promise<void> => {
    const result: any = await editingAllTheChatStatusToDeliveredService(receiver) as number | { chatmates: number[], stamp: Date }; 
    if(typeof result === 'number' && isFinite(result)) {
        return;
    }

    const connections = ((): string[] => {
        let listOfConnections: string[] = [];
        result.chatmates.forEach((senderId: number) => {
            const senderConnection: string[] = socketClients.clientConnections[senderId];
            listOfConnections = listOfConnections.concat(senderConnection);
        });
        return listOfConnections;
    })();

    if(connections.length === 0) {
        return;
    }

    io.to(connections).emit('notifySenderThatTheMessageIsBeingDelivered', { receiver, stamp: result.stamp });
}


export const typingMessage = async (user: socketUser, chatmateId: number): Promise<void> => {

    io.to(socketClients.clientConnections[chatmateId]).emit("typing message", user.id);
}


export const blankMessage = async (user: socketUser, chatmateId: number): Promise<void> => {

    io.to(socketClients.clientConnections[chatmateId]).emit("blank message", user.id);
}