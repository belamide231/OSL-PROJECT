import { mysql, redis } from "../app";
import { User } from "../interfaces/user";


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


export const getCompanyThemeForUnauthenticatedUsersService = async (sid: string, company: string, address: {} | { country: string, city: string, street: string }): Promise<number | { primary_color: string, secondary_color: string, whites_color: string }> => {

    try {

        const userKey = `company:${company}:customer:${sid}`;
        const addressJson = JSON.stringify(address);
        await redis.con.set(userKey, addressJson);

        const companyThemeKey = `company:${company}:theme`;
        const themeInCache = await redis.con.get(companyThemeKey);

        if(!themeInCache) {

            const [[themeInDb]] = await mysql.promise().query('SELECT primary_color, secondary_color, accent_color, whites_color FROM tbl_company_theme WHERE company = ?', [company]) as any;
            const stringifiedTheme = JSON.stringify(themeInDb);
            await redis.con.set(companyThemeKey, stringifiedTheme);

            return themeInDb;
        }

        return JSON.parse(themeInCache);

    } catch (error) {

        console.log('MYSQL ERROR');
        console.log(error);

        return 500;
    }
}


export const getActiveAccountsInSpecificCompanyService = async (company: string): Promise<string | null | number> => {

    try {

        const specificCompanyActiveAccounts = `companies:${company}:accounts`;
        const cachedActiveClientsInSpecificComapny = await redis.con.get(specificCompanyActiveAccounts);

        return cachedActiveClientsInSpecificComapny;

    } catch (error) {
        
        console.log('MYSQL/REDIS ERROR');
        console.log(error);
        
        return 500;
    }
}