import express from 'express';

// Using express types directly
type Request = any; // Express.Request
type Response = any; // Express.Response
import { z } from 'zod';
import mfaService from '../../services/auth/mfa.service';
import { formatResponse } from "../../shared/utils/response";

/**
 * MFA Controller
 * 
 * Handles HTTP requests related to multi-factor authentication
 */
export class MfaController {
  /**
   * Generate TOTP setup for authenticator app
   */
  async generateTotpSetup(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(formatResponse('error', 'Unauthorized', null));
      }
      
      const result = await mfaService.generateTotpSecret(userId);
      return res.status(200).json(formatResponse('success', 'TOTP setup generated', result));
    } catch (error) {
      console.error('Error generating TOTP setup:', error);
      return res.status(500).json(formatResponse('error', 'Failed to generate TOTP setup', null));
    }
  }
  
  /**
   * Verify and activate TOTP setup
   */
  async verifyAndActivateTotp(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(formatResponse('error', 'Unauthorized', null));
      }
      
      const schema = z.object({
        token: z.string().min(6).max(8)
      });
      
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(formatResponse('error', 'Invalid token format', validation.error));
      }
      
      const { token } = validation.data;
      
      const result = await mfaService.verifyAndActivateTotp(userId, token);
      return res.status(200).json(formatResponse('success', 'TOTP activated successfully', result));
    } catch (error: any) {
      console.error('Error verifying TOTP setup:', error);
      return res.status(400).json(formatResponse('error', error.message || 'Failed to verify TOTP setup', null));
    }
  }
  
  /**
   * Generate recovery codes
   */
  async generateRecoveryCodes(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(formatResponse('error', 'Unauthorized', null));
      }
      
      const recoveryCodes = await mfaService.generateRecoveryCodes(userId);
      return res.status(200).json(formatResponse('success', 'Recovery codes generated', { recoveryCodes }));
    } catch (error) {
      console.error('Error generating recovery codes:', error);
      return res.status(500).json(formatResponse('error', 'Failed to generate recovery codes', null));
    }
  }
  
  /**
   * Setup SMS verification
   */
  async setupSmsVerification(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(formatResponse('error', 'Unauthorized', null));
      }
      
      const schema = z.object({
        phoneNumber: z.string().min(10)
      });
      
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(formatResponse('error', 'Invalid phone number format', validation.error));
      }
      
      const { phoneNumber } = validation.data;
      
      const result = await mfaService.setupSmsVerification(userId, phoneNumber);
      return res.status(200).json(formatResponse('success', 'SMS verification code sent', {
        phoneNumber: phoneNumber,
        // In production, we would not return the verification code
        ...(process.env.NODE_ENV !== 'production' && { verificationCode: result.verificationCode })
      }));
    } catch (error: any) {
      console.error('Error setting up SMS verification:', error);
      return res.status(400).json(formatResponse('error', error.message || 'Failed to setup SMS verification', null));
    }
  }
  
  /**
   * Verify and activate SMS verification
   */
  async verifyAndActivateSms(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(formatResponse('error', 'Unauthorized', null));
      }
      
      const schema = z.object({
        code: z.string().length(6)
      });
      
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(formatResponse('error', 'Invalid verification code format', validation.error));
      }
      
      const { code } = validation.data;
      
      const result = await mfaService.verifyAndActivateSms(userId, code);
      return res.status(200).json(formatResponse('success', 'SMS verification activated', result));
    } catch (error: any) {
      console.error('Error verifying SMS setup:', error);
      return res.status(400).json(formatResponse('error', error.message || 'Failed to verify SMS setup', null));
    }
  }
  
  /**
   * Verify MFA during login
   */
  async verifyMfaDuringLogin(req: Request, res: Response) {
    try {
      const schema = z.object({
        userId: z.string().uuid(),
        token: z.string().min(6).max(8),
        type: z.enum(['totp', 'sms'])
      });
      
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(formatResponse('error', 'Invalid verification data', validation.error));
      }
      
      const { userId, token, type } = validation.data;
      
      let result;
      if (type === 'totp') {
        result = await mfaService.verifyTotpDuringLogin(userId, token);
      } else {
        // For SMS, we need to verify the code sent to the user's phone
        // This would typically be handled differently, but for simplicity we're using the same endpoint
        const user = await mfaService.verifyAndActivateSms(userId, token);
        result = { verified: user.success };
      }
      
      if (result.verified) {
        return res.status(200).json(formatResponse('success', 'MFA verification successful', { verified: true }));
      } else {
        return res.status(401).json(formatResponse('error', 'Invalid verification code', { verified: false }));
      }
    } catch (error: any) {
      console.error('Error verifying MFA:', error);
      return res.status(400).json(formatResponse('error', error.message || 'Failed to verify MFA', null));
    }
  }
  
  /**
   * Disable MFA
   */
  async disableMfa(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(formatResponse('error', 'Unauthorized', null));
      }
      
      const result = await mfaService.disableMfa(userId);
      return res.status(200).json(formatResponse('success', 'MFA disabled successfully', result));
    } catch (error) {
      console.error('Error disabling MFA:', error);
      return res.status(500).json(formatResponse('error', 'Failed to disable MFA', null));
    }
  }
}

export default new MfaController();

