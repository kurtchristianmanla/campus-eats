const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE, // 'gmail', 'sendgrid', etc.
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendResetEmail = async (email, resetLink) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
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
            Password Reset <span style="color: black;">Request</span>
          </h2>
          <p style="font-size: 16px; color: #555555; margin-bottom: 20px;">
            We received a request to reset your password. Click the button below to reset it:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="font-size: 16px; font-weight: bold; background-color: orange; color: white; padding: 15px 25px; border-radius: 4px; text-decoration: none;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 16px; color: #555555; margin-bottom: 20px;">
            If you didn't request this, you can safely ignore this email. The link will expire in <strong>15 minutes</strong>.
          </p>
          <p style="font-size: 16px; color: #555555;">
            If the button above doesn't work, copy and paste this link into your browser:
            <br>
            <a href="${resetLink}" style="color: orange; word-break: break-all;">${resetLink}</a>
          </p>
        </div>
      </body>
      </html>
    `
  };
  
  return transporter.sendMail(mailOptions);
};

module.exports = { sendResetEmail };