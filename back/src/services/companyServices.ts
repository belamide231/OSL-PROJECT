import { mysql } from "../app";

export const companyServices = async (company: string): Promise<any> => {
    
    try {

        const [rows] = await mysql.promise().query('SELECT * FROM tbl_company_theme WHERE company = ?', [company]) as any;
        delete rows[0].company;
        return { status: 200, result: rows[0] };

    } catch (error) {

        console.log('MYSQL ERROR');
        console.log(error);

        return { status: 500 };
    }
}