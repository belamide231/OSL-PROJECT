export interface Message {
    sender:                    string,
    sender_id:                 string,
    message:                   string,
    message_type:              string,
    message_id:                number,
    chat_id:                   number,
    sent_at:                   string | Date
}