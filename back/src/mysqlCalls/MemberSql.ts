interface Member {
    user_id:                   string,
    user_delivered_stamp:      string,
    user_seen_stamp:           string
}

export function MemberSqlConverter(MembersInformation: Member[], ChatType: string, ChatId: string): string {
    let Sql = '';

    // parameter_chat_type VARCHAR(99),
    // parameter_chat_id INT,
    // parameter_member_id VARCHAR(99),
    // parameter_member_deliver_stamp VARCHAR(99),
    // parameter_member_seen_stamp VARCHAR(99)

    MembersInformation.forEach((Member: Member) => {

        console.log(Member);

        const Call = `CALL update_members_status(${JSON.stringify(ChatType)}, ${ChatId}, ${JSON.stringify(Member.user_id)}, ${JSON.stringify(Member.user_delivered_stamp)}, ${JSON.stringify(Member.user_seen_stamp)});`;
        Sql = `${Sql}${Call}\n`;
    });

    return Sql;
}