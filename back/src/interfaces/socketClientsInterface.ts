export interface socketClientsInterface {
    clientConnections: {
        [key:number]: string[]
    },
    adminsId: number[],
    accountsId: number[],
    superUsersId: number[],
    usersId: number[]
};