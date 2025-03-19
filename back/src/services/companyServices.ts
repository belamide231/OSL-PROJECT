import { mysql } from "../app";
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

const urls: any = {
    "https://www.ibcauto.com": "ibc",
    "localhost:3000": "ibc"
};
export const getCompanyThemeForUnauthenticatedService = async (url: string): Promise<number | object> => {
    if(!urls[url]) {
        return 422;
    }

    try {

        const [[object]] = await mysql.promise().query('SELECT primary_color, secondary_color, secondary_color, whites_color FROM tbl_company_theme WHERE company = ?', [urls[url]]) as any;
        return object;

    } catch (error) {

        console.log('MYSQL ERROR');
        console.log(error);

        return 500;
    }
}