const mysql = require('mysql2');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
dotenv.config();

let length = 0;
let percentage = 0;
let divider = 0.01;
let called = 0;

const recursion = async (connectionInstance, sql) => {

    await connectionInstance.promise().query(sql[0]);
    sql.shift();

    if (length !== 0) {
        called++;
        if(called > length * divider) {
            percentage++;
            divider += 0.01;
            console.log(percentage + '% COMPLETE');
        }
    }

    if(sql.length !== 1)
        return recursion(connectionInstance, sql);

    return;
}

const startMigrations = async () => {

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

        await connectionInstance.promise().query(`CREATE DATABASE IF NOT EXISTS ${process.env.MYSQL_DATABASE};`);
        await connectionInstance.promise().query(`USE ${process.env.MYSQL_DATABASE};`);

        // TABLES
        await recursion(connectionInstance, fs.readFileSync(path.join(__dirname, 'tables.sql'), 'utf-8').split(';'));

        // PROCEDURES
        await recursion(connectionInstance, fs.readFileSync(path.join(__dirname, './procedures/message.sql'), 'utf-8').split(';;'));
        await recursion(connectionInstance, fs.readFileSync(path.join(__dirname, './procedures/ticket.sql'), 'utf-8').split(';;'));
        await recursion(connectionInstance, fs.readFileSync(path.join(__dirname, './procedures/profile.sql'), 'utf-8').split(';;'));
        await recursion(connectionInstance, fs.readFileSync(path.join(__dirname, './procedures/role.sql'), 'utf-8').split(';;'));
        await recursion(connectionInstance, fs.readFileSync(path.join(__dirname, './procedures/account.sql'), 'utf-8').split(';;'));

        // INITIALS
        const initials = fs.readFileSync(path.join(__dirname, 'initials.sql'), 'utf-8').split(';');
        length = initials.length;
        await recursion(connectionInstance, initials);

        await connectionInstance.end();
        console.log(`${process.env.LOCAL ? "LOCAL" : "CLOUD"} DATABASE MIGRATED SUCCESSESFULLY`);

    } catch (error) {

        console.log(error);
        console.log(`${process.env.LOCAL ? "LOCAL" : "CLOUD"} DATABASE MIGRATION FAILED`);
    }

    process.exit();
};

startMigrations();
