export interface Message {
    id:                 number;
    content_status:     string;
    sent_at:            string;
    delivered_at:       string;
    seen_at:            string;
    company_name:       string;
    sender_id:          number;
    receiver_id:        number;
    content_type:       string;
    content:            string
}