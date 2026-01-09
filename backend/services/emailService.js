// repositories/userRepository.js
import nodemailer from "nodemailer"
import fs from "fs"
import path from "path";
import { fileURLToPath } from "url";


// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const emailTemplate = path.join(__dirname, '..', 'templates', 'email.html');
const template = fs.readFileSync(emailTemplate, 'utf8');

// Helper function to replace template variables
const replaceTemplateConstant = (_template, key, data) => {
  const regex = new RegExp(key, 'g');
  return _template.replace(regex, data);
};

// Main send mail function
const sendMail = async (to, subject, message) => {
  const appName = process.env.APPNAME;
  const supportMail = process.env.SUPPORT_MAIL;
  const name = to.split("@")[0];

  let html = replaceTemplateConstant(template, "#APP_NAME#", appName);
  html = replaceTemplateConstant(html, '#NAME#', name);
  html = replaceTemplateConstant(html, '#MESSAGE#', message);
  html = replaceTemplateConstant(html, '#SUPPORT_MAIL#', supportMail);

  const transport = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.MAIL_USER,
    to,
    subject,
    text: message,
    html: html,
  };

  const infoMail = await transport.sendMail(mailOptions);
  return infoMail;
};

// Send forgot password email
const sendForgotPasswordMail = async (to, code) => {
  const subject = "Forgot Password";
  const message = `Your email verification code is <b>${code}</b>`;
  return sendMail(to, subject, message);
};

// Send welcome email
const sendWelcomeMail = async (to) => {
  const subject = "Welcome to Our App";
  const message = `Thank you for registering! We're excited to have you on board.`;
  return sendMail(to, subject, message);
};

// Send verification email
const sendVerificationMail = async (to, code) => {
  const subject = "Email Verification";
  const message = `Your email verification code is <b>${code}</b>`;
  return sendMail(to, subject, message);
};

// Export all functions
export default {
  sendForgotPasswordMail,
  sendWelcomeMail,
  sendVerificationMail,
  sendMail
};