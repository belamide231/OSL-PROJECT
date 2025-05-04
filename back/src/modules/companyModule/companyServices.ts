import { mysql, redis } from '../../app'
import { UserInterface } from './interfaces/user';
import { Connection } from "../../sockets/connection";
import { ThemeInterface } from './interfaces/theme';
import { AddressInterface } from './interfaces/address';


export async function FetchThemeForUsers(User: UserInterface): Promise<number | object> {
    try {

        const ThemeInRedis = await redis.con.get( ('company:[company]:theme').replace('[company]', User.company) )
        .then(Result => Result === null ? Result : JSON.parse(Result));
        if(ThemeInRedis) 
            return ThemeInRedis;

        await mysql.promise().query('CALL fetch_theme(?)', [User.company])
        .then(async ([[[ Theme ]]]: any) => await redis.con.set( ('company:[company]:theme').replace('[company]', User.company), JSON.stringify(Theme) ));

        return FetchThemeForUsers(User);

    } catch (Error) {
        
        console.log('FetchThemeForUsers', Error);
        return 500;
    }
}

export async function FetchThemeForCustomer(uuid: string, company: string, address: {} | AddressInterface): Promise<number | { theme: ThemeInterface, company: string }> {
    try {

        const CustomerKey = Connection.UserInformationKey(uuid);
        const JsonAddress = JSON.stringify(address);
        const Exists = await redis.con.exists(CustomerKey);

        if(!Exists) {

            const InformationStored = await redis.con.hSet(CustomerKey, { 'address': JsonAddress, 'company': company }).catch(() => null);
            if(!InformationStored) {
                console.log('FetchThemeForCustomer: Failed storing data in redis');
                return 500;
            }
    
            const InformationExpirySet = await redis.con.expire(CustomerKey, 60).catch(() => null);
            if(!InformationExpirySet) {
                await redis.con.del(CustomerKey);
                console.log('FetchThemeForCustomer: Failed setting expiry');
                return 500;
            }
        }

        const ThemeKey = ('company:[company]:theme').replace('[company]', company);
        const ThemeInRedis = await redis.con.get(ThemeKey).then(Result => Result === null ? Result : JSON.parse(Result));

        if(!ThemeInRedis) {

            const [[ ThemeInDb ]] = await mysql.promise().query('CALL fetch_theme(?)', [company]) as any;

            const ThemeStoredInRedis = await redis.con.set(ThemeKey, JSON.stringify(ThemeInDb)).catch(() => null);
            if(!ThemeStoredInRedis) {
                console.log('FetchThemeForCustomer: Failed storing data in redis');
            }

            return { 
                theme: ThemeInDb as ThemeInterface, 
                company 
            };
        }

        return {
            theme: ThemeInRedis,
            company
        }

    } catch (Error) {

        console.log('FetchThemeForCustomer', Error);
        return 500;
    }
}

export async function FetchUsers(company: string): Promise<any> {
    try {

        const Agents = await (async function recursion(Pointer: number, ArgKeys: string[]) {
            const { cursor, keys } = await redis.con.scan(Pointer, {
                MATCH: 'user_information:*'
            }) as { cursor: number, keys: string[] };

            if(cursor === 0) 
                return ArgKeys.concat(keys);

            return recursion(cursor, ArgKeys.concat(keys));
        })(0, []).then(async AgentsKey => {

            if(AgentsKey.length === 0) {

                await mysql.promise().query('CALL fetch_authorities(?)', [company])
                .then(([[[{ Authorities }]]]: any) => 
                    Authorities === null ? [] : Authorities)
                .then(async Authorities => 
                    await Promise.all(Authorities.map((Authority: any) => 
                        redis.con.set( ('user_information:[id]').replace('[id]', Authority.id), JSON.stringify(Authority), { EX: 3600 })
                        .then(_ => AgentsKey.push(('user_information:[id]').replace('[id]', Authority.id))))));
            }

            return await Promise.all(AgentsKey.map((Agent: string) => 
                redis.con.get(Agent)
            )).then(Agents => Agents.map(Agent => JSON.parse(Agent as string)));
        });

        return Agents;

    } catch (error) {
        
        console.log('FetchUsers', error);
        return 500;
    }
}