import amqplib from 'amqplib';
import { logger } from "../../shared/utils/logger";
import { processEmailNotification } from '../services/email.service';
import { processInAppNotification } from '../services/inapp.service';

// Queue names
const EMAIL_QUEUE = 'email_notifications';
const INAPP_QUEUE = 'inapp_notifications';

// Connection configuration
const MAX_RETRIES = 10;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 30000; // 30 seconds

// Connection objects
let connection: amqplib.Connection | null = null;
let channel: amqplib.Channel | null = null;
let retryCount = 0;
let isConnecting = false;

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(): number {
  const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, retryCount), MAX_RETRY_DELAY);
  return delay + Math.random() * 1000; // Add jitter
}

/**
 * Setup message queue connections and consumers
 */
export async function setupMessageQueue(): Promise<void> {
  if (isConnecting) {
    logger.warn('Connection attempt already in progress');
    return;
  }

  isConnecting = true;

  try {
    const amqpUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    
    // Connect to RabbitMQ
    connection = await amqplib.connect(amqpUrl);
    channel = await connection.createChannel();
    
    // Reset retry count on successful connection
    retryCount = 0;
    
    // Setup queues
    await channel.assertQueue(EMAIL_QUEUE, { 
      durable: true,
      deadLetterExchange: 'dlx',
      deadLetterRoutingKey: `${EMAIL_QUEUE}.dlq`
    });
    
    await channel.assertQueue(INAPP_QUEUE, { 
      durable: true,
      deadLetterExchange: 'dlx',
      deadLetterRoutingKey: `${INAPP_QUEUE}.dlq`
    });

    // Setup dead letter exchange and queues
    await channel.assertExchange('dlx', 'direct', { durable: true });
    await channel.assertQueue(`${EMAIL_QUEUE}.dlq`, { durable: true });
    await channel.assertQueue(`${INAPP_QUEUE}.dlq`, { durable: true });
    await channel.bindQueue(`${EMAIL_QUEUE}.dlq`, 'dlx', `${EMAIL_QUEUE}.dlq`);
    await channel.bindQueue(`${INAPP_QUEUE}.dlq`, 'dlx', `${INAPP_QUEUE}.dlq`);
    
    // Setup consumers
    await setupEmailConsumer();
    await setupInAppConsumer();
    
    logger.info('Message queue setup completed');
    
    // Handle connection closure
    connection.on('close', (err) => {
      logger.error('RabbitMQ connection closed', { error: err?.message });
      handleConnectionFailure();
    });
    
    connection.on('error', (err) => {
      logger.error('RabbitMQ connection error', { error: err.message });
      handleConnectionFailure();
    });

    isConnecting = false;
  } catch (error) {
    logger.error('Failed to setup message queue', { error, retryCount });
    handleConnectionFailure();
  }
}

/**
 * Handle connection failures and retry logic
 */
async function handleConnectionFailure(): Promise<void> {
  if (retryCount >= MAX_RETRIES) {
    logger.error('Max retry attempts reached. Manual intervention required.');
    process.exit(1); // Exit process to allow container orchestration to restart
    return;
  }

  // Clean up existing connections
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
  } catch (error) {
    logger.warn('Error while cleaning up connections', { error });
  }

  isConnecting = false;
  retryCount++;
  const delay = getRetryDelay();
  
  logger.info('Scheduling reconnection attempt', { 
    retryCount, 
    delay,
    nextAttemptIn: `${delay/1000} seconds` 
  });
  
  setTimeout(setupMessageQueue, delay);
}

/**
 * Setup email notification consumer
 */
async function setupEmailConsumer(): Promise<void> {
  if (!channel) {
    throw new Error('Channel not initialized');
  }

  channel.consume(EMAIL_QUEUE, async (msg) => {
    if (msg) {
      try {
        const content = JSON.parse(msg.content.toString());
        logger.info('Received email notification request', { 
          messageId: msg.properties.messageId,
          retryCount: msg.properties.headers?.['x-retry-count'] || 0
        });
        
        await processEmailNotification(content);
        channel?.ack(msg);
      } catch (error) {
        logger.error('Error processing email notification', { error });
        
        const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) + 1;
        if (retryCount <= 3) {
          // Retry with increasing delay
          channel?.nack(msg, false, true);
          logger.info('Requeuing email notification for retry', { retryCount });
        } else {
          // Move to dead letter queue after 3 retries
          channel?.nack(msg, false, false);
          logger.warn('Moving email notification to DLQ after max retries');
        }
      }
    }
  });
  
  logger.info('Email notification consumer setup completed');
}

/**
 * Setup in-app notification consumer
 */
async function setupInAppConsumer(): Promise<void> {
  if (!channel) {
    throw new Error('Channel not initialized');
  }

  channel.consume(INAPP_QUEUE, async (msg) => {
    if (msg) {
      try {
        const content = JSON.parse(msg.content.toString());
        logger.info('Received in-app notification request', { 
          messageId: msg.properties.messageId,
          retryCount: msg.properties.headers?.['x-retry-count'] || 0
        });
        
        await processInAppNotification(content);
        channel?.ack(msg);
      } catch (error) {
        logger.error('Error processing in-app notification', { error });
        
        const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) + 1;
        if (retryCount <= 3) {
          // Retry with increasing delay
          channel?.nack(msg, false, true);
          logger.info('Requeuing in-app notification for retry', { retryCount });
        } else {
          // Move to dead letter queue after 3 retries
          channel?.nack(msg, false, false);
          logger.warn('Moving in-app notification to DLQ after max retries');
        }
      }
    }
  });
  
  logger.info('In-app notification consumer setup completed');
}

/**
 * Publish a message to the email queue
 */
export async function publishEmailNotification(data: any): Promise<boolean> {
  if (!channel) {
    throw new Error('Channel not initialized');
  }

  try {
    const success = channel.sendToQueue(
      EMAIL_QUEUE,
      Buffer.from(JSON.stringify(data)),
      {
        persistent: true,
        messageId: `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        contentType: 'application/json',
        headers: {
          'x-retry-count': 0
        }
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
  if (!channel) {
    throw new Error('Channel not initialized');
  }

  try {
    const success = channel.sendToQueue(
      INAPP_QUEUE,
      Buffer.from(JSON.stringify(data)),
      {
        persistent: true,
        messageId: `inapp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        contentType: 'application/json',
        headers: {
          'x-retry-count': 0
        }
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
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
    logger.info('Message queue connection closed');
  } catch (error) {
    logger.error('Error closing message queue connection', { error });
  }
}

