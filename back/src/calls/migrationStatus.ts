import { Message } from "../interfaces/message";

export const migrationStatus = (x: Message) => `CALL migration_status(${x.sender_id}, ${x.receiver_id}, '${x.content_status}', ${x.delivered_at === null ? null: `CAST('${x.delivered_at}' AS DATETIME)`}, ${x.seen_at === null ? null : `CAST('${x.seen_at}' AS DATETIME)`});\n`;