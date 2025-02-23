export class messageModel {
    
    public messageId: any = null;
    public contentStatus: string = 'sent';
    public sentAt: string = new Date(Date.now() + 1000*60*60*8).toISOString();
    public deliveredAt: any = null;
    public seenAt: any = null;
    public companyName: any = null;

    constructor(
        public senderId: number,
        public receiverId: number,
        public contentType: string,
        public content: string
    ) {}

}