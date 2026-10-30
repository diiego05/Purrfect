import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// ──────────────────────────────────────────────────────
// Singleton transporter: tạo 1 lần, dùng nhiều lần
// ──────────────────────────────────────────────────────
let _transporter: Transporter | null = null;

const getTransporter = (): Transporter | null => {
  const user = process.env.MAIL_USER?.trim();
  const rawPass = process.env.MAIL_PASS?.trim();
  // Loại bỏ khoảng trắng nếu người dùng copy từ Google dạng "xxxx xxxx xxxx xxxx"
  const pass = rawPass?.replace(/\s+/g, '');
  const host = (process.env.MAIL_HOST || 'smtp.gmail.com').trim();

  if (!user || !pass) {
    return null;
  }

  const isGmail = host.toLowerCase().includes('gmail');

  if (!_transporter) {
    _transporter = nodemailer.createTransport(
      isGmail
        ? {
            service: 'gmail',
            auth: { user, pass },
            connectionTimeout: 15000,
            socketTimeout: 20000,
          }
        : {
            host,
            port: Number(process.env.MAIL_PORT) || 465,
            secure: process.env.MAIL_SECURE !== 'false',
            auth: { user, pass },
            connectionTimeout: 15000,
            socketTimeout: 20000,
          },
    );
  }

  return _transporter;
};

// Kiểm tra kết nối SMTP khi khởi động server
export const verifyMailerConnection = async (): Promise<void> => {
  const transporter = getTransporter();
  if (!transporter) return;

  try {
    await transporter.verify();
  } catch {
    _transporter = null;
  }
};

export const sendOtpEmail = async (
  toEmail: string,
  otpCode: string,
  type: 'REGISTER' | 'FORGOT_PASSWORD' = 'FORGOT_PASSWORD',
): Promise<boolean> => {
  const fromName = process.env.MAIL_FROM_NAME || 'Purrfect';
  const user = process.env.MAIL_USER;
  const transporter = getTransporter();

  if (!transporter || !user) {
    return false;
  }

  const isRegister = type === 'REGISTER';
  const subject = isRegister
    ? `[Purrfect] Mã xác nhận đăng ký tài khoản: ${otpCode}`
    : `[Purrfect] Mã xác nhận khôi phục mật khẩu: ${otpCode}`;
  const heading = isRegister ? 'Xác thực tạo tài khoản' : 'Khôi phục mật khẩu';
  const message = isRegister
    ? `Chào mừng bạn đến với Purrfect! Dưới đây là mã OTP để xác thực tài khoản <strong>${toEmail}</strong> của bạn:`
    : `Bạn vừa yêu cầu mã xác nhận để đặt lại mật khẩu cho tài khoản <strong>${toEmail}</strong>:`;

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to: toEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #0f172a; margin-bottom: 8px;">${heading} Purrfect</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.5;">${message}</p>
          <div style="background: #f1f5f9; padding: 18px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <span style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #2563eb;">${otpCode}</span>
          </div>
          <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">Mã có hiệu lực trong vòng <strong>5 phút</strong>. Nếu không phải bạn thực hiện, vui lòng bỏ qua thư này.</p>
        </div>
      `,
    });

    return true;
  } catch {
    _transporter = null;
    return false;
  }
};
