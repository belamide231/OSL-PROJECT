// import { io, socketClients } from "../app";
import { io } from "../app";
import { redis } from "../app";
import { Connection } from "./connection";
import { SocketUser } from "../interfaces/socketUser";
import { editingAllTheChatStatusToDeliveredService, editingTheMessageStatusToDeliveredService, seenChatService } from "../services/messageServices";


export const updatingTheChatStatusToSeen = async (receiverId: number, senderId: number): Promise<void> => {
    console.log(receiverId);
    console.log(senderId);

    const result = await seenChatService(receiverId, senderId) as any;
    if(isFinite(result)) {
        return;
    }

    result['receiverId'] = receiverId;
    
    /* Tangtangonon */
    // const senderConnections = socketClients.clientConnections[senderId];
    /* Katapusans tangtangonon */

    /* Mo puli */
    const senderConnectionsKey = Connection.Keys.keyForUserConnections(senderId);
    const senderConnections = await redis.con.lRange(senderConnectionsKey, 0, -1);
    /* Katapusans mo puli */

    if(senderConnections) {
        io.to(senderConnections).emit('notifySenderThatChatIsBeingSeen', result);
    }
}


export const editingTheChatStatusToDelivered = async (receiverId: number, senderId: number): Promise<void> => {
    const result: any = await editingTheMessageStatusToDeliveredService(receiverId, senderId) as number | { updated: boolean, stamp: Date };
    if(typeof result === 'number' && isFinite(result)) {
        return;
    }

    /* Tangtangonon */
    // const senderConnection = socketClients.clientConnections[senderId];
    /* Katapusans tangtangonon */

    /* Mo puli */
    const senderConnectionsKey = Connection.Keys.keyForUserConnections(senderId);
    const senderConnections = await redis.con.lRange(senderConnectionsKey, 0, -1);    
    /* Katapusans mo puli */


    io.to(senderConnections).emit('notifySenderThatTheMessageIsBeingDelivered', { receiverId, stamp: result.stamp });
}


export const editingAllTheChatStatusToDelivered = async (receiver: number): Promise<void> => {
    const result: any = await editingAllTheChatStatusToDeliveredService(receiver) as number | { chatmates: number[], stamp: Date }; 
    if(typeof result === 'number' && isFinite(result)) {
        return;
    }

    /* Tangtangonon */
    // const connections = ((): string[] => {
    //     let listOfConnections: string[] = [];
    //     result.chatmates.forEach((senderId: number) => {
    //         const senderConnection: string[] = socketClients.clientConnections[senderId];
    //         listOfConnections = listOfConnections.concat(senderConnection);
    //     });
    //     return listOfConnections;
    // })();
    /* Katapusans tangtangonon */

    /* Mo Puli */
    const usersListOfConnections = await Promise.all(
        result.chatmates.map((chatmate: number) => {
            const chatmateKey = Connection.Keys.keyForUserConnections(chatmate);
            return redis.con.lRange(chatmateKey, 0, -1);
        })
    );

    const connections = (() => {
        let connection: string[] = [];
        usersListOfConnections.forEach(userListOfConection => connection = connection.concat(userListOfConection));
        return connection;
    })();
    /* Katapusans mo puli */

    if(connections.length === 0) {
        return;
    }

    io.to(connections).emit('notifySenderThatTheMessageIsBeingDelivered', { receiver, stamp: result.stamp });
}


export const typingMessage = async (user: SocketUser, chatmateId: number): Promise<void> => {

    const chatmateConnections = await redis.con.lRange(chatmateId.toString(), 0, -1);
    io.to(chatmateConnections).emit("typing message", user.id);
}


export const blankMessage = async (user: SocketUser, chatmateId: number): Promise<void> => {

    const chatmateConnections = await redis.con.lRange(chatmateId.toString(), 0, -1);
    io.to(chatmateConnections).emit("blank message", user.id);
}