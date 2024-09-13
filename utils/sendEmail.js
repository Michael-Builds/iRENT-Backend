import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SMTP_HOST, SMTP_PORT, SMTP_PASSWORD, SMTP_USER, SMTP_SERVICE } from "../config/index.js";

// Manually define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        service: SMTP_SERVICE,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASSWORD
        }
    });

    const { email, subject, template, data } = options;

    // Path to your email template
    const templatePath = path.join(__dirname, '../emails', template);

    // Rendering email template with ejs
    const html = await ejs.renderFile(templatePath, data);

    const mailOptions = {
        from: SMTP_USER,
        to: email,
        subject: subject,
        html
    };

    await transporter.sendMail(mailOptions);
};
