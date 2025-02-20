export class messageModel {
    constructor(
        public contentStatus: string,
        public sentAt: Date,
        public deliveredAt: Date,
        public seenAt: Date,
        public companyName: string,
        public senderId: number,
        public receiverId: number,
        public contentType: string,
        public content: string
    ) {}
} 