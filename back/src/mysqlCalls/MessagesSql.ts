interface Message {
    sender_id:                 string,
    message:                   string,
    message_type:              string,
    message_id:                number,
    chat_id:                   number,
    sent_at:                   string
}

export function MessagesSqlConverter(Messages: Message[], ChatType: string): string {
    let Sql = '';
    Messages.forEach((Message: Message, index) => {

        // parameter_chat_type              VARCHAR(99),
        // parameter_last_element           BOOLEAN,
        // parameter_chat_id                INT,
        // parameter_message_id             INT,
        // parameter_sent_at                VARCHAR(99),
        // parameter_sender_id              VARCHAR(99),
        // parameter_message_type           VARCHAR(10),
        // parameter_message                VARCHAR(9999)

        let Call = `CALL insert_messages(${JSON.stringify(ChatType)}, ${index === Messages.length - 1}, ${Message.chat_id}, ${Message.message_id}, ${JSON.stringify(Message.sent_at)}, ${JSON.stringify(Message.sender_id)}, ${JSON.stringify(Message.message_type)}, ${JSON.stringify(Message.message)});`;

        Sql = `${Sql}${Call}\n`;
    });

    return Sql;
}