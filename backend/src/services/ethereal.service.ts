import nodemailer, { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;
let isRealSmtp = false;

export async function getEtherealTransporter(): Promise<Transporter> {
  if (transporter) {
    return transporter;
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
    isRealSmtp = true;
    console.log(`Using production SMTP server (${smtpHost}:${smtpPort}) for user ${smtpUser}`);
    return transporter;
  }

  const envUser = process.env.ETHEREAL_USER;
  const envPass = process.env.ETHEREAL_PASSWORD;

  if (envUser && envPass) {
    transporter = nodemailer.createTransport({
      host: process.env.ETHEREAL_HOST || 'smtp.ethereal.email',
      port: Number(process.env.ETHEREAL_PORT) || 587,
      secure: false,
      auth: {
        user: envUser,
        pass: envPass,
      },
    });
    console.log(`Using configured Ethereal SMTP account: ${envUser}`);
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`Created Ethereal SMTP test account: ${testAccount.user}`);
  }

  return transporter;
}

export interface SendEmailPayload {
  from: string;
  to: string;
  subject: string;
  body: string;
}

export interface SendEmailResult {
  messageId: string;
  previewUrl: string | false;
}

export async function sendEmailViaEthereal(payload: SendEmailPayload): Promise<SendEmailResult> {
  const mailer = await getEtherealTransporter();

  const fromSender = isRealSmtp && process.env.SMTP_USER
    ? `"${payload.from}" <${process.env.SMTP_USER}>`
    : payload.from;

  const info = await mailer.sendMail({
    from: fromSender,
    to: payload.to,
    subject: payload.subject,
    text: payload.body,
    html: payload.body.replace(/\n/g, '<br/>'),
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (isRealSmtp) {
    console.log(`Email delivered to ${payload.to}. Message ID: ${info.messageId}`);
  } else {
    console.log(`Sent email to ${payload.to} via Ethereal. Preview: ${previewUrl || 'N/A'}`);
  }

  return {
    messageId: info.messageId,
    previewUrl,
  };
}


