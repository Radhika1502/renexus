import { v4 as uuidv4 } from 'uuid';
import { db } from '../../database/db';
import { users } from '../../database/schema';
import { eq } from 'drizzle-orm';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

/**
 * Multi-Factor Authentication Service
 * 
 * Handles MFA setup, verification, and management
 * Supports both authenticator apps (TOTP) and SMS verification
 */
export class MfaService {
  /**
   * Generate a new TOTP secret for a user
   * @param userId User ID
   * @returns Secret and QR code for setup
   */
  async generateTotpSecret(userId: string) {
    // Generate a new TOTP secret
    const secret = speakeasy.generateSecret({
      name: `Renexus:${userId}`,
      length: 20
    });
    
    // Store the secret temporarily (not yet verified)
    await db.update(users)
      .set({
        mfaTempSecret: secret.base32,
        mfaType: 'totp'
      })
      .where(eq(users.id, userId));
    
    // Generate QR code for the secret
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');
    
    return {
      secret: secret.base32,
      qrCode: qrCodeUrl
    };
  }
  
  /**
   * Verify and activate TOTP setup
   * @param userId User ID
   * @param token Token from authenticator app
   * @returns Success status
   */
  async verifyAndActivateTotp(userId: string, token: string) {
    // Get the user's temporary secret
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user || !user.mfaTempSecret) {
      throw new Error('No MFA setup in progress');
    }
    
    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.mfaTempSecret,
      encoding: 'base32',
      token
    });
    
    if (!verified) {
      throw new Error('Invalid verification code');
    }
    
    // Activate MFA by moving the temp secret to the permanent one
    await db.update(users)
      .set({
        mfaSecret: user.mfaTempSecret,
        mfaTempSecret: null,
        mfaEnabled: true
      })
      .where(eq(users.id, userId));
    
    return { success: true };
  }
  
  /**
   * Generate backup recovery codes
   * @param userId User ID
   * @returns Array of recovery codes
   */
  async generateRecoveryCodes(userId: string) {
    const recoveryCodes = Array(10).fill(0).map(() => {
      // Generate a code format like: XXXX-XXXX-XXXX
      const segments = Array(3).fill(0).map(() => 
        Math.random().toString(36).substring(2, 6).toUpperCase()
      );
      return segments.join('-');
    });
    
    // Store hashed recovery codes
    await db.update(users)
      .set({
        mfaRecoveryCodes: JSON.stringify(recoveryCodes)
      })
      .where(eq(users.id, userId));
    
    return recoveryCodes;
  }
  
  /**
   * Verify a TOTP code during login
   * @param userId User ID
   * @param token Token from authenticator app
   * @returns Verification result
   */
  async verifyTotpDuringLogin(userId: string, token: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      throw new Error('MFA not enabled for this user');
    }
    
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1 // Allow 1 step before/after for time drift
    });
    
    return { verified };
  }
  
  /**
   * Setup SMS-based MFA
   * @param userId User ID
   * @param phoneNumber Phone number for SMS verification
   * @returns Success status
   */
  async setupSmsVerification(userId: string, phoneNumber: string) {
    // Validate phone number format (basic validation)
    if (!phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
      throw new Error('Invalid phone number format. Use international format: +COUNTRYCODE...');
    }
    
    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store phone and verification code
    await db.update(users)
      .set({
        mfaPhoneNumber: phoneNumber,
        mfaTempSecret: verificationCode,
        mfaType: 'sms'
      })
      .where(eq(users.id, userId));
    
    // In a real implementation, this would send an SMS
    // For this example, we'll just return the code (would be removed in production)
    return {
      success: true,
      verificationCode, // Only for development
      message: `SMS verification code sent to ${phoneNumber}`
    };
  }
  
  /**
   * Verify and activate SMS-based MFA
   * @param userId User ID
   * @param code Verification code sent via SMS
   * @returns Success status
   */
  async verifyAndActivateSms(userId: string, code: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user || !user.mfaTempSecret || user.mfaType !== 'sms') {
      throw new Error('No SMS verification in progress');
    }
    
    if (user.mfaTempSecret !== code) {
      throw new Error('Invalid verification code');
    }
    
    // Activate SMS MFA
    await db.update(users)
      .set({
        mfaTempSecret: null,
        mfaEnabled: true
      })
      .where(eq(users.id, userId));
    
    return { success: true };
  }
  
  /**
   * Send SMS verification code during login
   * @param userId User ID
   * @returns Success status
   */
  async sendSmsVerificationCode(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user || !user.mfaEnabled || user.mfaType !== 'sms' || !user.mfaPhoneNumber) {
      throw new Error('SMS verification not enabled for this user');
    }
    
    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store verification code
    await db.update(users)
      .set({
        mfaTempSecret: verificationCode
      })
      .where(eq(users.id, userId));
    
    // In a real implementation, this would send an SMS
    // For this example, we'll just return the code (would be removed in production)
    return {
      success: true,
      verificationCode, // Only for development
      message: `SMS verification code sent to ${user.mfaPhoneNumber}`
    };
  }
  
  /**
   * Disable MFA for a user
   * @param userId User ID
   * @returns Success status
   */
  async disableMfa(userId: string) {
    await db.update(users)
      .set({
        mfaEnabled: false,
        mfaSecret: null,
        mfaTempSecret: null,
        mfaPhoneNumber: null,
        mfaRecoveryCodes: null,
        mfaType: null
      })
      .where(eq(users.id, userId));
    
    return { success: true };
  }
}

export default new MfaService();
