import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    
    service: 'gmail',
    auth: {
        user: process.env.GOOGLE_APP_EMAIL,
        pass: process.env.GOOGLE_APP_PASSWORD,
    },
});

const expiry = () => {
    const timestamp = Date.now() + (1000 * 60 * 60);
    const date = new Date(timestamp);
    
    let hours = date.getHours();
    const minutes = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
    
    if (hours > 12) {
        return `${hours -= 12}:${minutes} PM`;
    } else if (hours === 0) {
        return `12:${minutes} AM`
    }
    
    return `${hours}:${minutes} AM`;
}

export const nodeMailer = async (email: string, url: string): Promise<boolean> => {

    try {

        const mailOptions: nodemailer.SendMailOptions = {
            from: process.env.GOOGLE_APP_EMAIL,
            to: email,
            subject: 'You are invited to join Chat-App Application',
            text: 'Please click the link to fill up your information.',
            html: `
              <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                <p style="font-size: 16px;">You are invited to join the Chat-App, please click the button below to fill in your details.</p>
                <p style="font-size: 14px; color: green;">Note: This will be available until ${expiry()}</p>
                <button style="background-color: #007BFF; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
                  <a href="${url}" style="text-decoration: none; color: white; font-size: 16px;">Fill In Information</a>
                </button>
              </div>
            `,
          };
          
        await transporter.sendMail(mailOptions);
        
    } catch (error) {

        return false;
    }

    return true;
}