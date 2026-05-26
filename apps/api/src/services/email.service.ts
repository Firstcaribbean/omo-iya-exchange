import { createEmailTransporter, EMAIL_FROM } from "../config/email";

export class EmailService {
  private static transporter = createEmailTransporter();

  private static getHTMLTemplate(title: string, body: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f9fc; margin: 0; padding: 0; color: #1e293b; }
          .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { background-color: #1e3a8a; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; color: #d97706; font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
          .header p { margin: 5px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9; }
          .content { padding: 40px 30px; line-height: 1.6; }
          .content h2 { margin-top: 0; color: #1e3a8a; font-size: 20px; }
          .cta-btn { display: inline-block; padding: 12px 30px; background-color: #d97706; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; text-align: center; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          .code-box { background-color: #f1f5f9; border-radius: 6px; padding: 15px; font-size: 24px; font-weight: 700; text-align: center; letter-spacing: 5px; color: #1e3a8a; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Omo Iya Exchange</h1>
            <p>Secure Digital Marketplace</p>
          </div>
          <div class="content">
            ${body}
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Omo Iya Exchange. All rights reserved.</p>
            <p>Nigeria's Premium Digital Goods Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static async sendVerificationEmail(email: string, name: string, token: string): Promise<boolean> {
    const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/verify-email?token=${token}`;
    const html = this.getHTMLTemplate(
      "Verify Your Email",
      `
      <h2>Hello ${name},</h2>
      <p>Welcome to Omo Iya Exchange! We're thrilled to have you join us. Before you can start purchasing digital products and accessing your wallet, we need to verify your email address.</p>
      <p>Please click the button below to confirm your account:</p>
      <div style="text-align: center;">
        <a href="${verifyUrl}" class="cta-btn">Verify Email Address</a>
      </div>
      <p>If the button doesn't work, copy and paste the link below into your browser:</p>
      <p style="word-break: break-all; font-size: 13px; color: #64748b;">${verifyUrl}</p>
      <p>This verification link will expire in 24 hours.</p>
      `
    );

    try {
      await this.transporter.sendMail({
        from: EMAIL_FROM,
        to: email,
        subject: "Verify your Omo Iya Exchange Account",
        text: `Hello ${name}, welcome to Omo Iya Exchange! Verify your account by opening this link: ${verifyUrl}`,
        html,
      });
      return true;
    } catch (error) {
      console.error("Email send failed:", error);
      return false;
    }
  }

  static async sendPasswordResetEmail(email: string, name: string, token: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/reset-password?token=${token}`;
    const html = this.getHTMLTemplate(
      "Reset Your Password",
      `
      <h2>Hello ${name},</h2>
      <p>We received a request to reset the password for your account on Omo Iya Exchange. If you didn't make this request, you can safely ignore this email.</p>
      <p>To set a new password, click the button below:</p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="cta-btn">Reset My Password</a>
      </div>
      <p>If the button doesn't work, copy and paste this link in your browser:</p>
      <p style="word-break: break-all; font-size: 13px; color: #64748b;">${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      `
    );

    try {
      await this.transporter.sendMail({
        from: EMAIL_FROM,
        to: email,
        subject: "Reset your Omo Iya Exchange Password",
        text: `Hello ${name}, reset your password via this link: ${resetUrl}`,
        html,
      });
      return true;
    } catch (error) {
      console.error("Password reset email send failed:", error);
      return false;
    }
  }

  static async sendOrderConfirmation(email: string, name: string, orderNumber: string, total: number): Promise<boolean> {
    const formattedAmount = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(total);
    const html = this.getHTMLTemplate(
      "Order Confirmed!",
      `
      <h2>Hello ${name},</h2>
      <p>Thank you for your order! Your payment has been received and verified. The order details are listed below:</p>
      <div class="code-box" style="letter-spacing: normal; font-size: 18px; padding: 10px;">
        Order: ${orderNumber}<br/>
        Amount Paid: ${formattedAmount}
      </div>
      <p>Our administrators are currently reviewing and preparing your items. As soon as they are approved, they will be released directly to your personal User Dashboard under <strong>My Purchases</strong>, and you will receive a notification.</p>
      <p>Thank you for choosing Omo Iya Exchange.</p>
      `
    );

    try {
      await this.transporter.sendMail({
        from: EMAIL_FROM,
        to: email,
        subject: `Payment Confirmed - Order ${orderNumber}`,
        text: `Hello ${name}, payment received for order ${orderNumber}. Total: ${formattedAmount}. Under administrator review.`,
        html,
      });
      return true;
    } catch (error) {
      console.error("Order confirmation email failed:", error);
      return false;
    }
  }
}
export default EmailService;
