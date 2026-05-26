import nodemailer from "nodemailer";

export const SMTP_HOST = process.env.SMTP_HOST || "";
export const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
export const SMTP_USER = process.env.SMTP_USER || "";
export const SMTP_PASS = process.env.SMTP_PASS || "";
export const EMAIL_FROM = process.env.EMAIL_FROM || "Omo Iya Exchange <noreply@omoiyaexchange.com>";

// Resend free tier email credentials fallback or direct Resend API Integration
export const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

export const createEmailTransporter = () => {
  // If SMTP is not configured, we'll log to console instead of throwing errors
  if (!SMTP_HOST && !SMTP_USER && !RESEND_API_KEY) {
    return {
      sendMail: async (mailOptions: any) => {
        console.log("-----------------------------------------");
        console.log("[EMAIL LOG (Local Development Mode)]");
        console.log(`To: ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Content:\n${mailOptions.text || mailOptions.html}`);
        console.log("-----------------------------------------");
        return { messageId: "mock-message-id" };
      }
    };
  }

  // Resend or custom SMTP configurations
  return nodemailer.createTransport({
    host: SMTP_HOST || "smtp.resend.com",
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER || "resend",
      pass: SMTP_PASS || RESEND_API_KEY,
    },
  });
};
