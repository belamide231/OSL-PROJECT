import { Message } from "../interfaces/message";

export function MessagesSqlConverter(Messages: Message[], Sql: string = ''): string {
    Messages.forEach((Message: Message, index) => 
        Sql += ('CALL insert_messages(?, ?, ?, ?, ?, ?, ?, ?);\n')
            .replace('?', (index === Messages.length - 1).toString())
            .replace('?', Message.chat_id.toString())
            .replace('?', Message.message_id.toString())
            .replace('?', JSON.stringify(Message.sent_at))
            .replace('?', JSON.stringify(Message.sender_id))
            .replace('?', JSON.stringify(Message.sender))
            .replace('?', JSON.stringify(Message.message_type))
            .replace('?', JSON.stringify(Message.message))
    );

    return Sql;
}