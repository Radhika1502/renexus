import amqplib from 'amqplib';
import { logger } from "../../shared/utils/logger";
import { processEmailNotification } from '../services/email.service';
import { processInAppNotification } from '../services/inapp.service';

// Queue names
const EMAIL_QUEUE = 'email_notifications';
const INAPP_QUEUE = 'inapp_notifications';

// Connection object
let connection: amqplib.Connection;
let channel: amqplib.Channel;

/**
 * Setup message queue connections and consumers
 */
export async function setupMessageQueue(): Promise<void> {
  try {
    const amqpUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    
    // Connect to RabbitMQ
    connection = await amqplib.connect(amqpUrl);
    channel = await connection.createChannel();
    
    // Setup queues
    await channel.assertQueue(EMAIL_QUEUE, { durable: true });
    await channel.assertQueue(INAPP_QUEUE, { durable: true });
    
    // Setup consumers
    await setupEmailConsumer();
    await setupInAppConsumer();
    
    logger.info('Message queue setup completed');
    
    // Handle connection closure
    connection.on('close', () => {
      logger.error('RabbitMQ connection closed');
      setTimeout(reconnect, 5000);
    });
    
    connection.on('error', (err) => {
      logger.error('RabbitMQ connection error', { error: err.message });
      setTimeout(reconnect, 5000);
    });
  } catch (error) {
    logger.error('Failed to setup message queue', { error });
    setTimeout(reconnect, 5000);
  }
}

/**
 * Reconnect to RabbitMQ
 */
async function reconnect(): Promise<void> {
  try {
    logger.info('Attempting to reconnect to RabbitMQ');
    await setupMessageQueue();
  } catch (error) {
    logger.error('Failed to reconnect to RabbitMQ', { error });
    setTimeout(reconnect, 5000);
  }
}

/**
 * Setup email notification consumer
 */
async function setupEmailConsumer(): Promise<void> {
  channel.consume(EMAIL_QUEUE, async (msg) => {
    if (msg) {
      try {
        const content = JSON.parse(msg.content.toString());
        logger.info('Received email notification request', { messageId: msg.properties.messageId });
        
        await processEmailNotification(content);
        channel.ack(msg);
      } catch (error) {
        logger.error('Error processing email notification', { error });
        // Nack and requeue if it's a temporary failure
        channel.nack(msg, false, true);
      }
    }
  });
  
  logger.info('Email notification consumer setup completed');
}

/**
 * Setup in-app notification consumer
 */
async function setupInAppConsumer(): Promise<void> {
  channel.consume(INAPP_QUEUE, async (msg) => {
    if (msg) {
      try {
        const content = JSON.parse(msg.content.toString());
        logger.info('Received in-app notification request', { messageId: msg.properties.messageId });
        
        await processInAppNotification(content);
        channel.ack(msg);
      } catch (error) {
        logger.error('Error processing in-app notification', { error });
        // Nack and requeue if it's a temporary failure
        channel.nack(msg, false, true);
      }
    }
  });
  
  logger.info('In-app notification consumer setup completed');
}

/**
 * Publish a message to the email queue
 */
export async function publishEmailNotification(data: any): Promise<boolean> {
  try {
    const success = channel.sendToQueue(
      EMAIL_QUEUE,
      Buffer.from(JSON.stringify(data)),
      {
        persistent: true,
        messageId: `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        contentType: 'application/json'
      }
    );
    
    logger.info('Published email notification', { data });
    return success;
  } catch (error) {
    logger.error('Failed to publish email notification', { error, data });
    return false;
  }
}

/**
 * Publish a message to the in-app notification queue
 */
export async function publishInAppNotification(data: any): Promise<boolean> {
  try {
    const success = channel.sendToQueue(
      INAPP_QUEUE,
      Buffer.from(JSON.stringify(data)),
      {
        persistent: true,
        messageId: `inapp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        contentType: 'application/json'
      }
    );
    
    logger.info('Published in-app notification', { data });
    return success;
  } catch (error) {
    logger.error('Failed to publish in-app notification', { error, data });
    return false;
  }
}

/**
 * Close connection to message queue
 */
export async function closeMessageQueue(): Promise<void> {
  try {
    if (channel) {
      await channel.close();
    }
    if (connection) {
      await connection.close();
    }
    logger.info('Message queue connection closed');
  } catch (error) {
    logger.error('Error closing message queue connection', { error });
  }
}

