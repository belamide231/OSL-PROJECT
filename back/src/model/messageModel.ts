export class messageModel {
    
    public id: any = null;
    public content_status: string = 'sent';
    public sent_at: string = new Date(Date.now() + 1000*60*60*8).toISOString();
    public delivered_at: any = null;
    public seen_at: any = null;
    public company_name: any = null;

    constructor(
        public sender_id: number,
        public receiver_id: number,
        public content_type: string,
        public content: string
    ) {}

}