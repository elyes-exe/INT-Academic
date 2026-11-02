import nodemailer from 'nodemailer';

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type SendEmailResult =
  | { success: true; devMode: boolean }
  | { success: false; devMode: false; message: string; providerBlocked?: boolean };

const resendApiUrl = 'https://api.resend.com/emails';

function parseProviderError(errorText: string) {
  try {
    const parsed = JSON.parse(errorText);
    const message = typeof parsed.message === 'string' ? parsed.message : errorText;
    const providerBlocked =
      parsed.statusCode === 403 &&
      (message.includes('testing emails') || message.includes('verify a domain'));

    return { message, providerBlocked };
  } catch {
    return {
      message: errorText,
      providerBlocked: errorText.includes('testing emails') || errorText.includes('verify a domain'),
    };
  }
}

function getEmailFromAddress() {
  const emailFrom = process.env.EMAIL_FROM;

  if (emailFrom && !emailFrom.includes('yourgmail@gmail.com')) {
    return emailFrom;
  }

  if (process.env.SMTP_USER) {
    return `INT App <${process.env.SMTP_USER}>`;
  }

  return process.env.RESEND_FROM_EMAIL || 'INT App <onboarding@resend.dev>';
}

async function sendWithGmail({ to, subject, html, text }: SendEmailInput): Promise<SendEmailResult> {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS?.replace(/\s/g, '');

  if (!user || !pass) {
    console.log(`[INT App email dev mode] To: ${to}\nSubject: ${subject}\n${text}`);
    return { success: true, devMode: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    await transporter.sendMail({
      from: getEmailFromAddress(),
      to,
      subject,
      html,
      text,
    });

    return { success: true, devMode: false };
  } catch (error) {
    return {
      success: false,
      devMode: false,
      message: error instanceof Error ? error.message : 'Unable to send email with Gmail SMTP.',
    };
  }
}

async function sendWithResend({ to, subject, html, text }: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[INT App email dev mode] To: ${to}\nSubject: ${subject}\n${text}`);
    return { success: true, devMode: true };
  }

  try {
    const response = await fetch(resendApiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: getEmailFromAddress(),
        to,
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const providerError = parseProviderError(errorText);

      return {
        success: false,
        devMode: false,
        message: providerError.message || 'Email provider rejected the request.',
        providerBlocked: providerError.providerBlocked,
      };
    }

    return { success: true, devMode: false };
  } catch (error) {
    return {
      success: false,
      devMode: false,
      message: error instanceof Error ? error.message : 'Unable to send email.',
    };
  }
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (process.env.EMAIL_PROVIDER === 'gmail') {
    return sendWithGmail(input);
  }

  return sendWithResend(input);
}
