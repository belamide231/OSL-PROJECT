import { mysql } from "../../app";
import { generateInvitationToken, generateRefreshToken, verifyInvitationToken } from "../../utilities/jwt";
import { nodeMailer } from "../../utilities/nodemailer";
import { loginAccountDto } from "./dto/loginAccountDto";
import { comparePassword, hashPassword } from "../../utilities/bcrypt";


export const loginAccountService = async (data: loginAccountDto): Promise<number | { rtk: string, role: string }> => {
    if(!data.username || !data.password) {
        return 422;
    }

    try {

        const [[[result]]] = await mysql.promise().query(`CALL login_account(?)`, [data.username]) as any;
        if(result.id === null) {
            return 404;
        }
    
        const match = await comparePassword(data.password, result.password);
        if(!match) {
            return 401;
        }
    
        const rtk = generateRefreshToken(result.id, result.name, result.company, result.role, result.picture);
        if(!rtk) {
            return 500;
        }
            
        return { rtk, role: result.role };

    } catch (error) {

        console.log("MYSQL ERROR");
        console.log(error);

        return 500;
    }
}

export const createAccountService = async (data: any): Promise<{ message: string, status_code: number } | number> => {
    try {

        const payload = verifyInvitationToken(data.invitation);
        if(!payload) {
            return { message: 'Invitation expired', status_code: 401 };
        }

        const hashedPassword = await hashPassword(data.password);
        const [[[result]]] = await mysql.promise().query("CALL create_account(?, ?, ?, ?, ?)", [data.username, hashedPassword, payload.email, payload.company, payload.role]) as any;
        return result;

    } catch (error) {

        console.error(error);
        return 500;
    }
}

export const InviteToSignupService = async (Data: { Gmail: string, Company: string, Role: string }): Promise<number> => {
    const SecondsBasedDuration = 3600;
    const InvitationKey = generateInvitationToken(Data.Gmail, Data.Company, Data.Role, SecondsBasedDuration);
    const Url = `http://localhost:4200/signup?invitation=${InvitationKey}`;

    try {

        const IsSent = await nodeMailer(Data.Gmail, Url, SecondsBasedDuration);
        if(!IsSent) {
            return 403;
        }
        return 200;    

    } catch (Error) {

        console.log(Error);
        return 500;
    }
}

export const getListOfAccounts = async (company: string): Promise<any> => {
    try {

        const [ListOfAccounts] = await mysql.promise().query(`
            SELECT prof.first_name, prof.email, prof.phone, role.company_name
            FROM tbl_roles AS role
            JOIN tbl_profiles AS prof 
                ON role.user_id = prof.user_id
            WHERE role.company_name = ? AND role.role = 'account'`, [company]);

        return ListOfAccounts;

    } catch (error) {

        console.log(error);
        return 500;
    }
}