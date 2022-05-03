import nodemailer from "nodemailer";

export const verifyUserEmail = (user: any) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "chaoocharles2@gmail.com",
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });

  const mailOptions = {
    from: '"Wedding Venues" <chaoocharles2@gmail.com>',
    to: user.email,
    subject: "Verify your email...",
    html: `<p>Hello ${user.firstName}, verify your email by clicking this link...</p>
      <a href ='${process.env.CLIENT_URL}/verify-email?emailToken=${user.emailToken}'>Verify Your Email</a>
      `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Verification email sent");
    }
  });
};
