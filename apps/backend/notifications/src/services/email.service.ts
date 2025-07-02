import nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { logger } from "../../shared/utils/logger";
import { getTemplate } from './template.service';

// Email provider types
type EmailProvider = 'smtp' | 'ses';

// Email notification payload
interface EmailNotification {
  to: string | string[];
  subject: string;
  templateId?: string;
  templateData?: Record<string, any>;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

// Get configured email provider
const getEmailProvider = (): EmailProvider => {
  return (process.env.EMAIL_PROVIDER as EmailProvider) || 'smtp';
};

// Create SMTP transport
const createSmtpTransport = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

// Create SES client
const createSesClient = () => {
  return new SESClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });
};

/**
 * Process email notification
 * @param notification Email notification payload
 */
export async function processEmailNotification(notification: EmailNotification): Promise<void> {
  try {
    logger.info('Processing email notification', { recipient: notification.to });
    
    // If template is specified, fetch and apply it
    if (notification.templateId && notification.templateData) {
      const template = await getTemplate(notification.templateId);
      
      if (!template) {
        throw new Error(`Template not found: ${notification.templateId}`);
      }
      
      // Apply template data
      let html = template.content;
      Object.entries(notification.templateData).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        html = html.replace(regex, value);
      });
      
      notification.html = html;
      notification.subject = template.subject;
    }
    
    const provider = getEmailProvider();
    
    if (provider === 'smtp') {
      await sendSmtpEmail(notification);
    } else if (provider === 'ses') {
      await sendSesEmail(notification);
    } else {
      throw new Error(`Unsupported email provider: ${provider}`);
    }
    
    logger.info('Email notification sent successfully', { recipient: notification.to });
  } catch (error) {
    logger.error('Failed to process email notification', { error, notification });
    throw error;
  }
}

/**
 * Send email using SMTP
 * @param notification Email notification payload
 */
async function sendSmtpEmail(notification: EmailNotification): Promise<void> {
  try {
    const transport = createSmtpTransport();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@renexus.com',
      to: notification.to,
      cc: notification.cc,
      bcc: notification.bcc,
      subject: notification.subject,
      text: notification.text,
      html: notification.html,
      attachments: notification.attachments,
    };
    
    await transport.sendMail(mailOptions);
  } catch (error) {
    logger.error('SMTP email sending failed', { error });
    throw error;
  }
}

/**
 * Send email using AWS SES
 * @param notification Email notification payload
 */
async function sendSesEmail(notification: EmailNotification): Promise<void> {
  try {
    const sesClient = createSesClient();
    
    const toAddresses = Array.isArray(notification.to) 
      ? notification.to 
      : [notification.to];
    
    const ccAddresses = notification.cc 
      ? (Array.isArray(notification.cc) ? notification.cc : [notification.cc]) 
      : [];
    
    const bccAddresses = notification.bcc 
      ? (Array.isArray(notification.bcc) ? notification.bcc : [notification.bcc]) 
      : [];
    
    const params = {
      Source: process.env.EMAIL_FROM || 'noreply@renexus.com',
      Destination: {
        ToAddresses: toAddresses,
        CcAddresses: ccAddresses,
        BccAddresses: bccAddresses,
      },
      Message: {
        Subject: {
          Data: notification.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Text: notification.text 
            ? { Data: notification.text, Charset: 'UTF-8' } 
            : undefined,
          Html: notification.html 
            ? { Data: notification.html, Charset: 'UTF-8' } 
            : undefined,
        },
      },
    };
    
    const command = new SendEmailCommand(params);
    await sesClient.send(command);
  } catch (error) {
    logger.error('SES email sending failed', { error });
    throw error;
  }
}

