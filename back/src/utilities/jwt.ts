import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const timestamp = () => Math.floor(Date.now() / 1000);

export const generateRefreshToken = (id: number, name: string, company: string ,role: string, picture: string | null) => {

    const privateKey = process.env.JWT_REFRESH_SECRET;
    return privateKey ? jwt.sign({ 
        sub: id,
        iat: timestamp(),
        exp: timestamp() + (60 * 60 * 24 * 30 * 6),
        iss: process.env.APP,
        aud: 'app-api',
        name,
        role,
        company,
        picture
    }, privateKey, {
        algorithm: 'HS256'
    }) : false;
}
export const verifyRefreshToken = (token: string) => {

    try {

        const secret = process.env.JWT_REFRESH_SECRET;

        return secret ? {
            token: true,
            payload: jwt.verify(token, secret)
        } : {
            token: false,
            payload: null
        }

    } catch {

        return {
            token: false,
            payload: null
        };
    }
}


export const generateAccessToken = (sid: string, id: number, name: string, company: string, role: string, picture: string | null) => {

    const privateKey = process.env.JWT_ACCESS_SECRET;
    return privateKey ? jwt.sign({ 
        sid,
        sub: id,
        iat: timestamp(),
        exp: timestamp() + (60 * 60),
        iss: process.env.APP,
        aud: 'app-api',
        name,
        role,
        company,
        picture
    }, privateKey, {
        algorithm: 'HS256'
    }) : false;
}
export const verifyAccessToken = (token: string) => {

    try {

        const secret = process.env.JWT_ACCESS_SECRET;

        return secret ? {
            token: true,
            payload: jwt.verify(token, secret)
        } : {
            token: false,
            payload: null
        }

    } catch {

        return {
            token: false,
            payload: null
        };
    }
}


export const generateInvitationToken = (email: string, company: string, role: string) => {

    const privateKey = process.env.JWT_REFRESH_SECRET;
    return privateKey ? jwt.sign({ 
        iat: timestamp(),
        exp: timestamp() + (60 * 60),
        iss: process.env.APP,
        aud: 'invitation-api',
        email,
        company,
        role,
    }, privateKey, {
        algorithm: 'HS256'
    }) : false;    
}
export const verifyInvitationToken = (invitationToken: string) => {

    try {

        const secret = process.env.JWT_REFRESH_SECRET;

        return secret ? {
            token: true,
            payload: jwt.verify(invitationToken, secret)
        } : {
            token: false,
            payload: null
        }

    } catch {

        return {
            token: false,
            payload: null
        };
    }

} 