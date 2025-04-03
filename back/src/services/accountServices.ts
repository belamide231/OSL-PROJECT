import { createAccountDTO } from "../dto/accountController/createAccountDto";
import { mysql, redis, sids } from "../app";
import { generateInvitationToken, generateRefreshToken } from "../utilities/jwt";
import { nodeMailer } from "../utilities/nodemailer";
import { inviteToSignupDto } from "../dto/accountController/inviteToSignupDto";
import { loginAccountDto } from "../dto/accountController/loginAccountDto";
import { comparePassword, hashPassword } from "../utilities/bcrypt";
import { IncrByCommand } from "@upstash/redis";


export const loginAccountService = async (data: loginAccountDto): Promise<number | { rtk: string, role: string }> => {
    if(!data.username || !data.password)
        return 422;

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


export const logoutAccountService = async (sid: string): Promise<number> => {
    try {

        await redis.con.del(sid);

    } catch (error) {

        console.log("REDIS ERROR");
        console.log(error);

        return 500;
    }
    
    return 200;
}

// CREATE PROCEDURE create_account(IN in_user VARCHAR(99), IN in_password VARCHAR(99), IN in_email VARCHAR(99), IN in_company_name VARCHAR(99), IN in_role VARCHAR(99))

export const createAccountService = async (data: createAccountDTO): Promise<number> => {

    try {

        const gmail = await redis.con.get(`db3:${data.sid}`);
        if(gmail === null) {
            return 401;
        }

        const jsonAccountInfo = await redis.con.get(gmail);
        if(jsonAccountInfo === null) {
            return 401;
        }

        const accountInfo = JSON.parse(jsonAccountInfo) as { role: string, email: string, company: string };
        const hashedPassword = await hashPassword(data.password);
        await mysql.promise().query("CALL create_account(?, ?, ?, ?, ?)", [data.username, hashedPassword, accountInfo.email, accountInfo.company, accountInfo.role]);
        return 200;

    } catch (error) {

        console.error(error);
        return 500;
    }
}

export const inviteToSignupService = async (data: { gmail: string, domain: string, role: string }): Promise<number> => {

    const domains = {
        'http://localhost:3000': 'ibc',
        'http://localhost:4200': 'ibc'
    };

    const invitationKey = generateInvitationToken(data.gmail, domains[data.domain as keyof typeof domains], data.role);
    const url = `http://localhost:3000/invite?invitation=${invitationKey}`;

    try {

        await redis.con.del('db2:' + data.gmail);
        const sent = await nodeMailer(data.gmail, url);
        
        if(!sent) {
            return 403;
        }
        
    } catch (error) {

        return 400;
    }

    return 200;
}