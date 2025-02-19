const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const dnsValue = `${process.env.DNS}/` || 'http://localhost:3000';
const dnsFile = `export const dns = "${dnsValue}";`;

let environmentDir = path.join(__dirname, '../../front/src/environment');
let environmentPath = path.join(environmentDir, 'dns.ts');

fs.mkdirSync(environmentDir, { recursive: true }) && (!fs.existsSync(environmentDir));
fs.writeFile(environmentPath, dnsFile, 'utf-8', (err) => err ? console.error('ERROR WRITING FILE') : console.log("SUCCESSFULLY CREATED"));

environmentDir = path.join(__dirname, '../../widget/src/environment');
environmentPath = path.join(environmentDir, 'dns.ts');

fs.mkdirSync(environmentDir, { recursive: true }) && (!fs.existsSync(environmentDir));
fs.writeFile(environmentPath, dnsFile, 'utf-8', (err) => err ? console.error('ERROR WRITING FILE') : console.log("SUCCESSFULLY CREATED"));