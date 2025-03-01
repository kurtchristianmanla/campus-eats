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

module.exports = { sendVerificationCode };