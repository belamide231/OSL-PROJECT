import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();


export const getMysqlConnection = () => {

    let uri = 'mysql://root:belamide231@localhost:3306';

    if(process.env.CLOUD_BASE)
        uri = process.env.MYSQL_PUBLIC_URL as string;

    try {

        const connectionInstance = mysql.createPool({
            uri,
            database: process.env.MYSQL_DATABASE,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        console.log(`CONNECTED TO MYSQL ${process.env.CLOUD_BASE ? 'CLOUD' : 'LOCAL'}`);
        return connectionInstance;

    } catch(error) {

        console.log("MYSQL ERROR");
        console.log(error);
        process.exit();
    }
};