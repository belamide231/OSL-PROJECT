export const insertMessage = (message: any) => 
`CALL insert_message(
    ${message.id}, 
    ${"'" + message.content_status + "'"}, 
    ${message.sent_at ? "(CAST('" + (new Date(message.sent_at).toISOString()).replace('T', ' ').slice(0, 19) + "' AS DATETIME) + INTERVAL 8 HOUR)" : null}, 
    ${message.delivered_at ? "(CAST('" + (new Date(message.delivered_at).toISOString()).replace('T', ' ').slice(0, 19) + "' AS DATETIME) + INTERVAL 8 HOUR)" : null}, 
    ${message.seen_at ? "(CAST('" + (new Date(message.seen_at).toISOString()).replace('T', ' ').slice(0, 19) + "' AS DATETIME) + INTERVAL 8 HOUR)" : null}, 
    ${message.company_name}, 
    ${message.sender_id}, 
    ${message.receiver_id}, 
    ${"'" + message.content_type + "'"}, 
    ${"'" + message.content + "'"}
);\n`;