import { mysql, redis } from "../app";
import { User } from "../interfaces/user";
import { generateAccessToken } from "../utilities/jwt";

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

        const key = `companies:${company}:theme`;
        const themeInCache = await redis.con.get(key);
        if(!themeInCache) {

            const [[themeInDb]] = await mysql.promise().query('SELECT primary_color, secondary_color, whites_color FROM tbl_company_theme WHERE company = ?', [company]) as any;
            const stringifiedTheme = JSON.stringify(themeInDb);
            await redis.con.set(key, stringifiedTheme);

            return themeInDb;
        }
        
        return JSON.parse(themeInCache) as { primary_color: string, secondary_color: string, whites_color: string };

    } catch (error) {

        console.log('MYSQL ERROR');
        console.log(error);

        return 500;
    }
}