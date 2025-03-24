// 2. Email Service for Sending Verification Codes (utils/emailService.js)
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE, // 'gmail', 'sendgrid', etc.
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendVerificationCode = async (email, code) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Your Email Verification Code',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
            @media screen and (max-width: 600px) {
                h2 {
                font-size: 20px !important;
                }
                div {
                padding: 10px 5px !important;
                }
            }
        </style>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="padding: 20px 5px;">
          <h2 style="font-size: 24px; color: #333333; margin-bottom: 20px;">
            Email Verification <span style="color: black;">Code</span>
          </h2>
          <p style="font-size: 16px; color: #555555; margin-bottom: 20px;">
            Please use the following <span style="color: orange; font-weight: bold;">code</span> to verify your email address:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 24px; letter-spacing: 5px; font-weight: bold; background-color: #FFF9F0; color: orange; padding: 15px; border-radius: 4px;">
              ${code} <!-- Dynamic code -->
            </div>
          </div>
          <p style="font-size: 16px; color: #555555; margin-bottom: 20px;">
            This code will expire in <strong>1 hour</strong>.
          </p>
          <p style="font-size: 16px; color: #555555;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
      </body>
      </html>
    `
  };
  
  return transporter.sendMail(mailOptions);
};

const sendSellerVerificationEmail = async (email, verificationUrl) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify Your Seller Account',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Seller Account Verification</title>
        <style>
          @media screen and (max-width: 600px) {
            .button {
              padding: 10px 15px !important;
              font-size: 14px !important;
            }
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #f97316;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin: 20px 0;
            
          }
        </style>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-bottom: 20px;">Welcome to Campus Eats Seller Platform</h2>
          <p style="color: #475569; margin-bottom: 20px;">
            Your seller account has been created by an administrator. Please verify your email address to activate your account.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
              style="display: inline-block; padding: 12px 24px; background-color: #f97316; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; text-align: center;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #475569; margin-top: 20px;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: #f97316; word-break: break-all;">${verificationUrl}</p>
          <p style="color: #64748b; margin-top: 30px; font-size: 14px;">
            This link will expire in 24 hours. If you didn't request this, please ignore this email.
          </p>
        </div>
      </body>
      </html>
    `
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationCode, sendSellerVerificationEmail };