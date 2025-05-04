export interface MessageInterface {
  sender_id: string,
  message: string,
  message_type: string,
  message_id: number,
  chat_id: number,
  sent_at: Date | string
}

export interface StatusInterface {
  member_id: string,
  member_message_seen_stamp: null | string,
  member_message_delivered_stamp: null | string
}

export interface ChatListInterface {
  Messages: MessageInterface[],
  Status: StatusInterface[]
}