export interface MessageModel {
    message_id: number | null,
    chat_id: number | null,
    sender_id: string,
    sender: string,
    sent_at: string,
    message_type: 'text' | 'file',
    message: string
}