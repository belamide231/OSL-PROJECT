const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const dropDatabase = async () => {

    let uri = 'mysql://root:belamide231@localhost:3306';

    if(process.env.CLOUD_BASE)
        uri = process.env.MYSQL_PUBLIC_URL;

    try {
        
        const connectionInstance = mysql.createPool({
            uri,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });    

        await connectionInstance.promise().query(`DROP DATABASE IF EXISTS ${process.env.MYSQL_DATABASE};`);                  
        await connectionInstance.end();

        console.log(`${process.env.CLOUD_BASE ? "LOCAL" : "CLOUD"}  DATABASE DROPPED SUCCESSFULLY`);

    } catch (error) {
        
        console.log(`${process.env.CLOUD_BASE ? "LOCAL" : "CLOUD"} DATABASE DROP FAILED`);
        console.log(error);
    }

    process.exit();
};
dropDatabase();
