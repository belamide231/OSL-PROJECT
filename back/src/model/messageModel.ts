import { stamp } from "../utilities/stamp";

export class messageModel {
    
    public id: any = null;
    public content_status: string = 'sent';
    public sent_at: string = stamp.toISOString();
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