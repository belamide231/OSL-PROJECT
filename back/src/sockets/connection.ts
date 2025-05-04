import { Socket } from 'socket.io';
import { redis } from '../app';
import { cookiesParser } from '../utilities/cookieParser';
import { io } from '../app';
import { verifyAccessToken } from '../utilities/jwt';
import { SocketUserInterface } from './interfaces/socketUser';
import { Keys } from './keys';
import { ChatSocket } from '../modules/chatModule/chatSocket';


export class Connection extends Keys {

    public static async ConnectionAuthenticator(socket: Socket): Promise<any> {

        const cookies = socket.request.headers.cookie;
        if(!cookies) {
            return;
        }
    
        const ObjectCookies = cookiesParser(cookies) as any;
        if(!ObjectCookies) {
            return;
        }
    
        if(ObjectCookies.uuid) {
            return await Connection.CustomersConnection(socket, ObjectCookies.uuid as string);
        }        
            
        const decoded = verifyAccessToken(ObjectCookies.atk) as any;
        if(!decoded.token) {
            return;
        }
    
        return await Connection.UsersConnection(socket, decoded);
    }


    private static async UsersConnection(socket: Socket, decoded: any): Promise<void> {

        const client = decoded.payload;
        const id = client.sub;
        const user: SocketUserInterface = {
            id: client.sub,
            name: client.name,
            role: client.role,
            company: client.company,
            picture: client.picture
        };

        const UserInformationKey = Connection.UserInformationKey(id);
        const InformationStored = await redis.con.set(UserInformationKey, JSON.stringify(user)).catch(() => null);
        if(!InformationStored) {
            console.log('Failed to store user information in redis');
            return;
        }

        const UserListOfConnectionKey = Connection.UserConnectionKey(id);
        const ConnectionStored = await redis.con.lPush(UserListOfConnectionKey, socket.id);

        
        if(ConnectionStored === null) {
            console.log('Failed to store user connection in redis');
            await redis.con.del(UserInformationKey);
        }

        const PushingTheUserIdInTheListKey = Connection.CompanyUsersKey(user);
        await redis.con.sendCommand(['FCALL', 'active_insert', '1', PushingTheUserIdInTheListKey, id.toString()]);
        console.log(('? signed-in').replace('?', user.name));
    
        io.to(socket.id).emit('connected');
        socket.broadcast.emit('someone-connected', (user)); 
        await ChatSocket(socket, id);

        socket.on('disconnect', async () => {
            
            await redis.con.lRem(UserListOfConnectionKey, 1, socket.id);
            const usersRemainingConnections = await redis.con.exists(UserListOfConnectionKey);
            if(usersRemainingConnections) {
                return;
            }
            console.log(('? signed-out').replace('?', user.name));

            io.emit('disconnected', user.id);
            await redis.con.lRem(PushingTheUserIdInTheListKey, 1, id.toString());
            await redis.con.del(UserInformationKey);
        });
    }
    
    private static async CustomersConnection(socket: Socket, uuid: string): Promise<void> {   
        
        const CustomerInformationKey = Connection.UserInformationKey(uuid);
        const WithExpiry = await redis.con.ttl(CustomerInformationKey);

        if(WithExpiry !== -1) {

            const Permanent = await redis.con.persist(CustomerInformationKey);
            if(!Permanent) {
                console.log('Error making it permanent');
                return;
            }
        }

        const CustomerConnectionKey = Connection.UserConnectionKey(uuid);
        console.log(CustomerConnectionKey);
        const StoredCustomerConnection = await redis.con.lPush(CustomerConnectionKey, socket.id).catch(() => null);
        if(!StoredCustomerConnection) {
            console.log('Error storing connection');
            await redis.con.del(CustomerInformationKey);
            return;
        }

        socket.emit('connected');
        await ChatSocket(socket, uuid);

        socket.on('disconnect', async () => {
           await redis.con.del(CustomerInformationKey);
           await redis.con.lRem(CustomerConnectionKey, 1, socket.id);
        });
    }
}