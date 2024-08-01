const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  secure: true,
});

exports.sendRegistrationEmail = (email) => {
  const mailOptions = {
    from: emailUser,
    to: email,
    subject: "Registration Successful",
    text: "Thank you for registering. Continue with login using this link: <login link>",
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

