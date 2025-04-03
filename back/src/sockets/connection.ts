import { Socket } from 'socket.io';


// import { socketClients, redis } from '../app';
import { redis } from '../app';
import { cookiesParser } from '../utilities/cookieParser';
import { io } from '../app';
import { verifyAccessToken } from '../utilities/jwt';
import { blankMessage, editingAllTheChatStatusToDelivered, editingTheChatStatusToDelivered, typingMessage, updatingTheChatStatusToSeen } from './message';
import { SocketUser } from '../interfaces/socketUser';


export class Connection {


    public static Keys = class {


        public static keyForUserInformation = (id: number) => {
            return `specific_user:${id}:information`;
        }
    
        
        public static keyForUserConnections = (id: number) => {
            return `specific_user:${id}:connections`;
        }
    
    
        public static keyForListOfUserWithSpecificCompanyAndRole = (user: SocketUser) => {
            return `company:${user.company}:active_users:${user.role}:list:${user}`;
        }
    }
    

    public static connectionAuthenticator = async (socket: Socket): Promise<any> => {

        const cookies = socket.request.headers.cookie;
        if(!cookies) {
            return;
        }
    
        const parsedCookies = cookiesParser(cookies) as any;
        if(!parsedCookies) {
            return;
        }
    
        if(!parsedCookies.atk && parsedCookies.sid) {
            await this.connectionForUnauthenticatedUsers(socket, parsedCookies.sid);
        }
    
        const decoded = verifyAccessToken(parsedCookies.atk) as any;
        if(!decoded.token) {
            return;
        }
    
      
        await this.connectionForAuthenticatedUsers(socket, decoded);
    };


    private static connectionForAuthenticatedUsers = async (socket: Socket, decoded: any): Promise<void> => {

        const client = decoded.payload;
        const id = client.sub;
        const user: SocketUser = {
            id: client.sub,
            name: client.name,
            role: client.role,
            company: client.company,
            picture: client.picture
        };
    
        /* Tangtangonon */
        const redisStoringInformationResult = await redis.con.set('db4:' + id.toString(), client.sid, { EX: 60 * 60 }).catch(() => false);
        if(!redisStoringInformationResult) {
            return;
        }
        /* Katapusans tangtangonon */
    
        /* Tangtangonon */
        // socketClients.clientConnections[id] ? socketClients.clientConnections[id].push(socket.id) : (socketClients.clientConnections[id] = [socket.id]);
        /* Katapusans tangtangonon */   
    
        /* Ang mo puli */
        const redisUserInfoKey = this.Keys.keyForUserInformation(id);
        const redisStoringUserInfo = await redis.con.set(redisUserInfoKey, JSON.stringify(user)).catch(() => false);
        if(!redisStoringUserInfo) {
            return;
        }
        const redisConnectionKey = this.Keys.keyForUserConnections(id);
        const redisStoringUserConnection = await redis.con.lPush(redisConnectionKey, socket.id);
        if(redisStoringUserConnection === null) {
            await redis.con.del(redisUserInfoKey);
        }
        /* Katapusans mo puli */
    
        /* Tangtangonon */
        // switch (client.role) {
        //     case 'admin':
        //         if(!socketClients.adminsId.includes(id)) {
        //             socketClients.adminsId.push(id);
        //         }
        //     break;
        //     case 'account':
        //         if (!socketClients.accountsId.includes(id)) {
        //             socketClients.accountsId.push(id);
        //         }
        //     break;
        // }
        /* Katapusans tangtangonon */
        /* Ang mo puli */
        const redisStoringUserIdInTheListKey = this.Keys.keyForListOfUserWithSpecificCompanyAndRole(user);
        const redisStoringUserIdInTheList = await redis.con.lPush(redisStoringUserIdInTheListKey, id.toString()).catch(() => false);
        if(!redisStoringUserIdInTheList) {
            await redis.con.del(redisUserInfoKey);
            await redis.con.lRem(redisConnectionKey, 1, socket.id);
            return;
        }
        /* Katapusans mo puli */
    
    
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
            
            /* Tangtangonon */
            // socketClients.clientConnections[id].splice(socketClients.clientConnections[id].indexOf(socket.id), 1);
            /* Katapusans tangtangunon */
    
            /* Ang mo puli */
            await redis.con.lRem(redisConnectionKey, 1, socket.id);
            /* Katapusans mo puli */
    
            const usersRemainingConnections = await redis.con.exists(redisConnectionKey);
            if(usersRemainingConnections) {
                return;
            }
    
            /* Tangtangonon */
            // if(socketClients.clientConnections[id].length !== 0) {
            //     return;
            // }
            /* Katapusans tangtangonon */
    
            /* Tanawonon */
            io.emit('disconnected', user.id);
            /* Katapusans tanawonon */
    
            /* Tangtangonon */
            // delete socketClients.clientConnections[id];
            /* Katapusans tangtangonon */
            await redis.con.del('db4:' + id.toString());
    
            /* Tangtangonon */
            // switch (client.role) {
            //     case 'admin':
            //         socketClients.adminsId.splice(socketClients.adminsId.indexOf(id), 1);
            //     break;
            //     case 'account':
            //         socketClients.adminsId.splice(socketClients.accountsId.indexOf(id), 1);
            //     break;
            // }
            /* Katapusans tangtangnonon */
            /* Ang mo puli */
            await redis.con.lRem(redisStoringUserIdInTheListKey, 1, id.toString());
            await redis.con.del(redisUserInfoKey);
            /* Katapusans mo puli */
        });
    }
    

    private static connectionForUnauthenticatedUsers = async (socket: Socket, sid: string): Promise<void> => {   

        
    }
}

// export const connection = async (socket: Socket): Promise<any> => {

//     const cookies = socket.request.headers.cookie;
//     if(!cookies) {
//         return;
//     }

//     const parsedCookies = cookiesParser(cookies) as any;
//     if(!parsedCookies) {
//         return;
//     }

//     if(!parsedCookies.atk && parsedCookies.sid) {
//         await connectionForUnauthenticatedUsers(socket, parsedCookies.sid);
//     }

//     const decoded = verifyAccessToken(parsedCookies.atk) as any;
//     if(!decoded.token) {
//         return;
//     }

//     await connectionForAuthenticatedUsers(socket, decoded);
// };


// const connectionForAuthenticatedUsers = async (socket: Socket, decoded: any): Promise<void> => {

//     const client = decoded.payload;
//     const id = client.sub;
//     const user: SocketUser = {
//         id: client.sub,
//         name: client.name,
//         role: client.role,
//         company: client.company,
//         picture: client.picture
//     };

//     /* Tangtangonon */
//     const redisStoringInformationResult = await redis.con.set('db4:' + id.toString(), client.sid, { EX: 60 * 60 }).catch(() => null);
//     if(redisStoringInformationResult === null) {
//         return;
//     }
//     /* Katapusans tangtangonon */

//     /* Tangtangonon */
//     socketClients.clientConnections[id] ? socketClients.clientConnections[id].push(socket.id) : (socketClients.clientConnections[id] = [socket.id]);
//     /* Katapusans tangtangonon */

//     /* Ang mo puli */
//     const redisUserInfoKey = `company:${user.company}:active_users:${user.role}:specific_user:${id}:information`;
//     const redisStoringUserInfo = await redis.con.set(redisUserInfoKey, JSON.stringify(user)).catch(() => null);
//     if(redisStoringUserInfo === null) {
//         return;
//     }
//     const redisConnectionKey = `company:${user.company}:active_users:${user.role}:specific_user:${id}:connections`;
//     const redisStoringUserConnection = await redis.con.lPush(redisConnectionKey, socket.id);
//     if(redisStoringUserConnection === null) {
//         await redis.con.del(redisUserInfoKey);
//     }
//     /* Katapusans mo puli */

//     /* Tangtangonon */
//     switch (client.role) {
//         case 'admin':
//             if(!socketClients.adminsId.includes(id)) {
//                 socketClients.adminsId.push(id);
//             }
//         break;
//         case 'account':
//             if (!socketClients.accountsId.includes(id)) {
//                 socketClients.accountsId.push(id);
//             }
//         break;
//     }
//     /* Katapusans tangtangonon */
//     /* Ang mo puli */
//     const redisStoringUserIdInTheListKey = `company:${user.company}:active_users:${user.role}:list:${id}`;
//     const redisStoringUserIdInTheList = await redis.con.lPush(redisStoringUserIdInTheListKey, id.toString()).catch(() => null);
//     if(redisStoringUserIdInTheList === null) {
//         await redis.con.del(redisUserInfoKey);
//         await redis.con.lRem(redisConnectionKey, 1, socket.id);
//         return;
//     }
//     /* Katapusans mo puli */


//     io.to(socket.id).emit('connected');
//     socket.broadcast.emit('someone joined', (user));
    
//     socket.on('notifyBackendThatAllChatIsBeingReceived', () => {
//         editingAllTheChatStatusToDelivered(user.id)
//     });
//     socket.on('notifyBackendThatChatIsBeingReceived', (senderId: number) => {
//         editingTheChatStatusToDelivered(user.id, senderId)
//     });
//     socket.on('notifyBackendThatChatIsBeingSeen', (senderId: number) => {
//         updatingTheChatStatusToSeen(user.id, senderId)
//     });

//     socket.on('typing message', (chatmateId: number) => typingMessage(user, chatmateId));
//     socket.on('blank message', (chatmateId: number) => blankMessage(user, chatmateId));    
//     socket.on('disconnect', async () => {
        
//         /* Tangtangonon */
//         socketClients.clientConnections[id].splice(socketClients.clientConnections[id].indexOf(socket.id), 1);
//         /* Katapusans tangtangunon */

//         /* Ang mo puli */
//         await redis.con.lRem(redisConnectionKey, 1, socket.id);
//         /* Katapusans mo puli */

//         const usersRemainingConnections = await redis.con.exists(redisConnectionKey);
//         if(usersRemainingConnections) {
//             return;
//         }

//         /* Tangtangonon */
//         if(socketClients.clientConnections[id].length !== 0) {
//             return;
//         }
//         /* Katapusans tangtangonon */

//         /* Tanawonon */
//         io.emit('disconnected', user.id);
//         /* Katapusans tanawonon */

//         delete socketClients.clientConnections[id];
//         await redis.con.del('db4:' + id.toString());

//         /* Tangtangonon */
//         switch (client.role) {
//             case 'admin':
//                 socketClients.adminsId.splice(socketClients.adminsId.indexOf(id), 1);
//             break;
//             case 'account':
//                 socketClients.adminsId.splice(socketClients.accountsId.indexOf(id), 1);
//             break;
//         }
//         /* Katapusans tangtangnonon */
//         /* Ang mo puli */
//         await redis.con.lRem(redisStoringUserIdInTheListKey, 1, id.toString());
//         await redis.con.del(redisUserInfoKey);
//         /* Katapusans mo puli */
//     });
// }


// const connectionForUnauthenticatedUsers = async (socket: Socket, sid: string): Promise<void> => {   

        
// }