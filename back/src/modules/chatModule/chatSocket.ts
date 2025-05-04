import { Socket } from "socket.io";
import * as ChatService from "./chatServices";

export async function ChatSocket(Socket: Socket, Id: string) {
    
    Socket.on('chats-delivered', () => {
        ChatService.UpdateChatsToDelivered(Id);
    });

    Socket.on('fetch-message', async ({ Exists, ChatId }) => {
        Socket.emit('fetched-message', await ChatService.FetchMessage(Exists, ChatId.toString()));
    });

    Socket.on('chat-delivered', (ChatId) => {
        ChatService.UpdateChatToDelivered(Id, ChatId.toString());
    });

    Socket.on('chat-seen', (ChatId) => {
        ChatService.UpdateChatToSeen(Id, ChatId.toString());
    });
}