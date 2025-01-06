import nodemailer from "nodemailer";
import dotenv from 'dotenv';

dotenv.config(); 


const transporter = nodemailer.createTransport({
    host: process.env.NODEMAILER_HOST,
    port: 465,
    secure: true, // Use true for port 465
    auth: {
        user: "spwarshi@gmail.com",
        pass: process.env.NODEMAILER_PASS, // Use your App Password here
    },
});

async function sendMail(to, sub, msg) {
    try {
        const info = await transporter.sendMail({
            from: '"Sadmaan Warshi" <spwarshi@gmail.com>', // Sender's name and email
            to: to, // Recipient's email
            subject: sub, // Subject line
            html: msg, // Email content in HTML
        });

        console.log("Email sent: ", info.messageId);
    } catch (error) {
        console.error("Error while sending email: ", error);
    }
}

// Call the function


export default sendMail;
