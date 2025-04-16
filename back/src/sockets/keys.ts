import { SocketUser } from "../interfaces/socketUser";

export class Keys {

    public static keyForUserInformation(id: number | string) {
        return `specific_user:${id}:information`;
    }

    public static keyForUserConnections(id: number| string) {
        return `specific_user:${id}:connections`;
    }

    public static keyForListOfUserWithSpecificCompanyAndRole(user: SocketUser) {
        return `company:${user.company}:active_users:${user.role}:list`;
    }
}