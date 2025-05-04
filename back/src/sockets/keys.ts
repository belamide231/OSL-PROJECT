import { SocketUserInterface } from "./interfaces/socketUser";

export class Keys {

    public static UserInformationKey(Id: number | string): string {
        return ('specific_user:[id]:information')
            .replace('[id]', typeof Id === 'number' ? Id.toString() : Id);
    }

    public static UserConnectionKey(Id: number| string): string {
        return ('specific_user:[id]:connections')
            .replace('[id]', typeof Id === 'number' ? Id.toString() : Id);
    }

    public static CompanyUsersKey(User: SocketUserInterface) {

        return User.role === 'admin' ?
        ('company:active_users:admin:list') :
        ('company:[company]:active_users:[role]:list')
            .replace('[company]', User.company)
            .replace('[role]', User.role);
    }
}