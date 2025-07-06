import nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { logger } from '../logger';
import { Notification } from './notification.service';

export interface EmailConfig {
  provider: 'smtp' | 'ses';
  from: string;
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  ses?: {
    region: string;
    credentials: {
      accessKeyId: string;
      secretAccessKey: string;
    };
  };
}

export class EmailService {
  private config: EmailConfig;
  private smtpTransport?: nodemailer.Transporter;
  private sesClient?: SESClient;

  constructor(config: EmailConfig) {
    this.config = config;
    this.initialize();
  }

  private initialize(): void {
    if (this.config.provider === 'smtp' && this.config.smtp) {
      this.smtpTransport = nodemailer.createTransport({
        host: this.config.smtp.host,
        port: this.config.smtp.port,
        secure: this.config.smtp.secure,
        auth: {
          user: this.config.smtp.auth.user,
          pass: this.config.smtp.auth.pass,
        },
      });
    } else if (this.config.provider === 'ses' && this.config.ses) {
      this.sesClient = new SESClient({
        region: this.config.ses.region,
        credentials: {
          accessKeyId: this.config.ses.credentials.accessKeyId,
          secretAccessKey: this.config.ses.credentials.secretAccessKey,
        },
      });
    }
  }

  async sendEmail(notification: Notification, recipient: string): Promise<void> {
    try {
      if (this.config.provider === 'smtp') {
        await this.sendSmtpEmail(notification, recipient);
      } else if (this.config.provider === 'ses') {
        await this.sendSesEmail(notification, recipient);
      } else {
        throw new Error(`Unsupported email provider: ${this.config.provider}`);
      }
      logger.info(`Email sent successfully to ${recipient}`);
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  private async sendSmtpEmail(notification: Notification, recipient: string): Promise<void> {
    if (!this.smtpTransport) {
      throw new Error('SMTP transport not initialized');
    }

    const mailOptions = {
      from: this.config.from,
      to: recipient,
      subject: notification.title,
      text: notification.message,
      html: this.generateEmailHtml(notification),
    };

    await this.smtpTransport.sendMail(mailOptions);
  }

  private async sendSesEmail(notification: Notification, recipient: string): Promise<void> {
    if (!this.sesClient) {
      throw new Error('SES client not initialized');
    }

    const params = {
      Source: this.config.from,
      Destination: {
        ToAddresses: [recipient],
      },
      Message: {
        Subject: {
          Data: notification.title,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: this.generateEmailHtml(notification),
            Charset: 'UTF-8',
          },
          Text: {
            Data: notification.message,
            Charset: 'UTF-8',
          },
        },
      },
    };

    const command = new SendEmailCommand(params);
    await this.sesClient.send(command);
  }

  private generateEmailHtml(notification: Notification): string {
    // Basic email template - can be enhanced with more sophisticated templates
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 5px; }
            .content { padding: 20px 0; }
            .footer { text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${notification.title}</h2>
            </div>
            <div class="content">
              ${notification.message}
              ${notification.data ? `<pre>${JSON.stringify(notification.data, null, 2)}</pre>` : ''}
            </div>
            <div class="footer">
              <p>This is an automated notification from Renexus</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

let globalService: EmailService | undefined;

export const createEmailService = (config: EmailConfig): EmailService => {
  if (!globalService) {
    globalService = new EmailService(config);
  }
  return globalService;
};

export const getEmailService = (): EmailService => {
  if (!globalService) {
    // Default configuration - should be overridden in production
    const config: EmailConfig = {
      provider: 'smtp',
      from: process.env.EMAIL_FROM || 'noreply@renexus.com',
      smtp: {
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
      },
    };
    globalService = createEmailService(config);
  }
  return globalService;
}; 