import { sqlDateConverter } from "../utilities/sqlDateConverter";

export const migrateStatusByLoadingMoreMessages = (json: { 
    senderId: number, 
    receiverId: number, 
    status: string, 
    deliveredAt: string | null, 
    seenAt: string | null 
}): string => {
    // console.log(json);
    return `CALL migrate_status_by_loading_more_messages(${json.senderId}, ${json.receiverId}, '${json.status}', ${sqlDateConverter(json.deliveredAt)}, ${sqlDateConverter(json.seenAt)});\n`;
}