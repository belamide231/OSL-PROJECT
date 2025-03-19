import { Message } from "../interfaces/message";

export const migrationStatus = (message: Message) => `
CALL migration_status(
    ${message.sender_id}, 
    ${message.receiver_id}, 
    '${message.content_status}', 
    ${message.delivered_at === null ? null : `CAST('${new Date(message.delivered_at).toISOString().slice(0, 19)}' AS DATETIME)`}, 
    ${message.seen_at === null ? null : `CAST('${new Date(message.seen_at).toISOString().slice(0, 19)}' AS DATETIME)`}
);\n`;