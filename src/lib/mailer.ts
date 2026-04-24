import nodemailer from 'nodemailer';

const TEAL = '#1a7a5e';
const TEAL_LIGHT = '#22a075';

let _transport: nodemailer.Transporter | null = null;

function getTransport() {
  if (_transport) return _transport;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error('SMTP is not configured (SMTP_HOST/SMTP_USER/SMTP_PASS required)');
  }
  _transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return _transport;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@dcsgroup.uk.com';
  const subject = 'Reset your DCS Financial Operations password';
  const text = `Reset your password using the link below (valid for 1 hour):\n\n${resetUrl}\n\nIf you did not request this, ignore this email.`;
  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#0a1a14;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0a1a14;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" role="presentation" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:20px;padding:44px 40px;">
        <tr><td>
          <h2 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 8px;letter-spacing:-0.025em;">Reset your password</h2>
          <p style="color:rgba(255,255,255,0.55);font-size:13px;line-height:1.6;margin:0 0 24px;">
            Click the button below to set a new password. This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
          </p>
          <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,${TEAL},${TEAL_LIGHT});color:#fff;text-decoration:none;border-radius:10px;padding:14px 22px;font-size:14px;font-weight:700;">Reset password</a>
          <p style="color:rgba(255,255,255,0.35);font-size:11px;margin:28px 0 0;word-break:break-all;">${resetUrl}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  await getTransport().sendMail({ from, to, subject, text, html });
}
