import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// ──────────────────────────────────────────────────────
// Singleton transporter: tạo 1 lần, dùng nhiều lần
// ──────────────────────────────────────────────────────
let _transporter: Transporter | null = null;

const getTransporter = (): Transporter | null => {
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;
  const host = process.env.MAIL_HOST || 'smtp.gmail.com';

  if (!user || !pass) {
    console.warn('[MAILER] MAIL_USER hoặc MAIL_PASS chưa được cấu hình trong .env');
    return null;
  }

  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host,
      port: 465,
      secure: true,
      auth: { user, pass },
      connectionTimeout: 10000,  // 10s timeout kết nối
      socketTimeout: 15000,       // 15s timeout gửi
    });

    console.log(`[MAILER] Transporter SMTP được khởi tạo: ${user} → ${host}:465`);
  }

  return _transporter;
};

// Kiểm tra kết nối SMTP khi khởi động server
export const verifyMailerConnection = async (): Promise<void> => {
  const transporter = getTransporter();
  if (!transporter) return;

  try {
    await transporter.verify();
    console.log('[MAILER] ✅ Kết nối SMTP thành công!');
  } catch (err: any) {
    console.error('[MAILER] ❌ Kết nối SMTP thất bại:', err?.message || err);
    console.error('[MAILER] → Kiểm tra MAIL_USER, MAIL_PASS trong .env (Gmail cần App Password, không dùng mật khẩu thường)');
    // Đặt lại transporter để thử lại lần sau
    _transporter = null;
  }
};

export const sendOtpEmail = async (
  toEmail: string,
  otpCode: string,
  type: 'REGISTER' | 'FORGOT_PASSWORD' = 'FORGOT_PASSWORD'
): Promise<boolean> => {
  const fromName = process.env.MAIL_FROM_NAME || 'Purrfect';
  const user = process.env.MAIL_USER;
  const transporter = getTransporter();

  if (!transporter || !user) {
    console.error('[MAILER] Không có transporter khả dụng. Bỏ qua gửi email đến:', toEmail);
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
    console.log(`[MAILER] Đang gửi OTP (${type}) đến: ${toEmail} ...`);
    const startTime = Date.now();

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

    const elapsed = Date.now() - startTime;
    console.log(`[MAILER] ✅ Gửi OTP (${type}) đến ${toEmail} thành công! (${elapsed}ms)`);
    return true;
  } catch (err: any) {
    // Reset transporter để kết nối lại lần sau nếu bị timeout/ngắt
    _transporter = null;
    console.error(`[MAILER] ❌ Gửi email đến ${toEmail} thất bại:`);
    console.error(`[MAILER]   code: ${err?.code}`);
    console.error(`[MAILER]   message: ${err?.message}`);
    if (err?.response) console.error(`[MAILER]   SMTP response: ${err.response}`);
    return false;
  }
};
