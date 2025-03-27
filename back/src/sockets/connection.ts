import { Socket } from 'socket.io';


import { socketClients, redis } from '../app';
import { cookiesParser } from '../utilities/cookieParser';
import { io } from '../app';
import { verifyAccessToken } from '../utilities/jwt';
import { blankMessage, editingAllTheChatStatusToDelivered, editingTheChatStatusToDelivered, typingMessage, updatingTheChatStatusToSeen } from './message';
import { socketUser } from '../interfaces/socketUser';


export const connection = async (socket: Socket): Promise<any> => {

    const cookies = socket.request.headers.cookie;
    if(!cookies) {
        return;
    }

    const parsedCookies = cookiesParser(cookies) as any;
    if(!parsedCookies) {
        return;
    }

    if(!parsedCookies.atk && parsedCookies.sid) {
        await connectionForUnauthenticatedUsers(socket, parsedCookies.sid);
    }

    const decoded = verifyAccessToken(parsedCookies.atk) as any;
    if(!decoded.token) {
        return;
    }

    await connectionForAuthenticatedUsers(socket, decoded);
};


const connectionForAuthenticatedUsers = async (socket: Socket, decoded: any): Promise<void> => {

    const client = decoded.payload;
    const id = client.sub;
    const user: socketUser = {
        id: client.sub,
        name: client.name,
        role: client.role,
        company: client.company,
        picture: client.picture
    };

    try {
        await redis.con.set('db4:' + id.toString(), client.sid, { EX: 60 * 60 });
    } catch {
        return;
    }

    socketClients.clientConnections[id] ? socketClients.clientConnections[id].push(socket.id) : (socketClients.clientConnections[id] = [socket.id]);

    switch (client.role) {
        case 'admin':
            if (!socketClients.adminsId.includes(id)) socketClients.adminsId.push(id);
        break;
        case 'account':
            if (!socketClients.accountsId.includes(id)) socketClients.accountsId.push(id);
        break;
        case 'superUser':
            if (!socketClients.superUsersId.includes(id)) socketClients.superUsersId.push(id);
        break;
        case 'user':
            if (!socketClients.usersId.includes(id)) socketClients.usersId.push(id);
        break;
    }

    io.to(socket.id).emit('connected');
    socket.broadcast.emit('someone joined', (user));
    
    socket.on('notifyBackendThatAllChatIsBeingReceived', () => {
        editingAllTheChatStatusToDelivered(user.id)
    });
    socket.on('notifyBackendThatChatIsBeingReceived', (senderId: number) => {
        editingTheChatStatusToDelivered(user.id, senderId)
    });
    socket.on('notifyBackendThatChatIsBeingSeen', (senderId: number) => {
        updatingTheChatStatusToSeen(user.id, senderId)
    });

    socket.on('typing message', (chatmateId: number) => typingMessage(user, chatmateId));
    socket.on('blank message', (chatmateId: number) => blankMessage(user, chatmateId));    
    socket.on('disconnect', async () => {
        
        socketClients.clientConnections[id].splice(socketClients.clientConnections[id].indexOf(socket.id), 1);

        if(socketClients.clientConnections[id].length !== 0) return;

        io.emit('disconnected', user.id);

        delete socketClients.clientConnections[id];
        await redis.con.del('db4:' + id.toString());

        switch (client.role) {
            case 'admin':
                socketClients.adminsId.splice(socketClients.adminsId.indexOf(id), 1);
            break;
            case 'account':
                socketClients.adminsId.splice(socketClients.accountsId.indexOf(id), 1);
            break;
            case 'superUser':
                socketClients.adminsId.splice(socketClients.superUsersId.indexOf(id), 1);
            break;
            case 'user':
                socketClients.adminsId.splice(socketClients.usersId.indexOf(id), 1);
            break;
        }
    });
}


const connectionForUnauthenticatedUsers = async (socket: Socket, sid: string): Promise<void> => {   
}