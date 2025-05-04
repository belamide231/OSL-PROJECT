import { Member } from "../interfaces/member";

export function MemberSqlConverter(MembersInformation: Member[], ChatId: string, Sql: string = ''): string {
    MembersInformation.forEach((Member: Member) => 
        Sql += ('CALL update_members_status(?, ?, ?, ?);\n')
        .replace('?', ChatId)
        .replace('?', JSON.stringify(Member.member_id))
        .replace('?', JSON.stringify(Member.member_message_delivered_stamp))
        .replace('?', JSON.stringify(Member.member_message_seen_stamp))
    );

    return Sql;
}