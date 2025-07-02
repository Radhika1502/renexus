import express from 'express';
import mfaController from '../../../controllers/auth/mfa.controller';
import { authenticate } from '../../../middleware/auth';

// Create router
const router = express.Router ? express.Router() : express();
// Alternative approach if needed:
// const router = require('express').Router();

/**
 * MFA routes
 * Most routes require authentication except for verification during login
 */

// Generate TOTP setup for authenticator app
router.post('/totp/setup', authenticate, mfaController.generateTotpSetup);

// Verify and activate TOTP setup
router.post('/totp/verify', authenticate, mfaController.verifyAndActivateTotp);

// Generate recovery codes
router.post('/recovery-codes', authenticate, mfaController.generateRecoveryCodes);

// Setup SMS verification
router.post('/sms/setup', authenticate, mfaController.setupSmsVerification);

// Verify and activate SMS verification
router.post('/sms/verify', authenticate, mfaController.verifyAndActivateSms);

// Verify MFA during login (no auth required)
router.post('/verify', mfaController.verifyMfaDuringLogin);

// Disable MFA
router.post('/disable', authenticate, mfaController.disableMfa);

export default router;
