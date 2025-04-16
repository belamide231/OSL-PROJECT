export interface MessageModel {
    message_id: number | null,
    chat_id: number,
    sender_id: string,
    sent_at: string,
    message_type: 'text' | 'file',
    message: string
}