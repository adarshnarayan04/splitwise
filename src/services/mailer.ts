import nodemailer from "nodemailer";

const {
  SMTP_HOST = "sandbox.smtp.mailtrap.io",
  SMTP_PORT = "2525",
  SMTP_USER = "username",
  SMTP_PASS = "password",
  SMTP_FROM = "no-reply@example.com",
} = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465, 
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export async function sendEmail({
  to,
  subject,
  text,
}: {
  to: string[];
  subject: string;
  text: string;
}) {
  if (!to || to.length === 0) return;
  try {
    await transporter.sendMail({ from: SMTP_FROM, to, subject, text });
  } catch (err: any) {
    console.error("Email send failed", err.message || err);
  }
}
