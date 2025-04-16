import { mysql, redis } from "../app";
import { User } from "../interfaces/user";
import { Connection } from "../sockets/connection";


export const getCompanyThemeService = async (user: User): Promise<number | object> => {
    try {
        const [[object]] = await mysql.promise().query('SELECT * FROM tbl_company_theme WHERE company = ?', [user.company]) as any;
        delete object.company;
        return object;
    } catch (error) {
        console.log('MYSQL ERROR');
        console.log(error);
        return 500;
    }
}


export async function GetCompanyThemeForCustomer(uuid: string, company: string, address: {} | { country: string, city: string, street: string }): Promise<number | {   
    theme: { 
        'primary-color': string, 
        'secondary-color': string, 
        'whites-color': string, 
        'accent-color': string 
    },
    company: string 
}> {
    try {
        const CustomerKey = Connection.keyForUserInformation(uuid);
        const JsonCustomerAddress = JSON.stringify(address);
        const ExistingCustomerInformation = await redis.con.exists(CustomerKey);

        if(!ExistingCustomerInformation) {

            const StoringCustomerInformationResult = await redis.con.hSet(CustomerKey, {
                'address': JsonCustomerAddress, 
                'company': company
            }).catch(() => null);
            if(!StoringCustomerInformationResult) {
                console.log('Failed storing data in redis');
                return 500;
            }
    
            const SettingCustomersInformationExpiry = await redis.con.expire(CustomerKey, 60).catch(() => null);
            if(!SettingCustomersInformationExpiry) {
                await redis.con.del(CustomerKey);
                console.log('Failed setting expiry');
                return 500;
            }
        }

        const CompanyThemeKey = `company:${company}:theme`;
        const CompanyThemeInRedis = await redis.con.get(CompanyThemeKey);

        if(!CompanyThemeInRedis) {

            const Sql = `
                SELECT 
                    primary_color 	AS '--primary-color', 
                    secondary_color AS '--secondary-color', 
                    accent_color 	AS '--accent-color', 
                    whites_color 	AS '--whites-color'
                FROM tbl_company_theme 
                WHERE company = ?
            `;

            const [[CompanyThemeInDb]] = await mysql.promise().query(Sql, [company]) as any;
            const JsonCompanyTheme = JSON.stringify(CompanyThemeInDb);

            const StoringCompanyThemeInRedisResult = await redis.con.set(CompanyThemeKey, JsonCompanyTheme).catch(() => null);
            if(!StoringCompanyThemeInRedisResult) {
                console.log('Failed storing data in redis');
            }

            return { 
                theme: CompanyThemeInDb, 
                company 
            };
        }
        return {
            theme: JSON.parse(CompanyThemeInRedis),
            company
        };

    } catch (error) {

        console.log('MYSQL ERROR');
        console.log(error);
        return 500;
    }
}


export const getActiveUsersInSpecificCompanyService = async (company: string, role: string): Promise<any> => {
    try {
        let totalUserId: any[] = [];
        const activeAccountIdInSpecificCompanyKey = `company:${company}:active_users:account:list`;
        const activeAccountIdInSpecificCompany = await redis.con.lRange(activeAccountIdInSpecificCompanyKey, 0, -1);

        totalUserId = totalUserId.concat(activeAccountIdInSpecificCompany);

        if(['account', 'admin'].includes(role)) {

            const activeAdminIdInSpecificCompanyKey = `company:${company}:active_users:admin:list`;
            const activeAdminIdInSpecificCompany = await redis.con.lRange(activeAdminIdInSpecificCompanyKey, 0, -1);

            totalUserId = totalUserId.concat(activeAdminIdInSpecificCompany);
        }

        const CombinedKeyOfSpecificUser = totalUserId.map(id => Connection.keyForUserInformation(parseInt(id)));

        const ListOfActiveUsersInformationInSpecificCompany = await redis.con.mGet(CombinedKeyOfSpecificUser);
        const ListOfActiveUsersInformationInSpecificCompanyFiltered = ListOfActiveUsersInformationInSpecificCompany.filter(Boolean);

        const ParsedListOfActiveUserInformations = ListOfActiveUsersInformationInSpecificCompanyFiltered.map((json: any) => JSON.parse(json));
        return ParsedListOfActiveUserInformations;

    } catch (error) {
        
        console.log('REDIS ERROR');
        console.log(error);
        
        return 500;
    }
}