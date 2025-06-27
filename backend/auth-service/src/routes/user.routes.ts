import express from 'express';
import passport from 'passport';
import { body, param } from 'express-validator';
import { UserController } from '../controllers/user.controller';
import { validateRequest } from '../middleware/validateRequest';
import { checkRole } from '../middleware/checkRole';
import { UserRole } from '@renexus/api-types';

const router = express.Router();
const userController = new UserController();

/**
 * @route GET /api/users
 * @desc Get all users (admin only)
 * @access Private/Admin
 */
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  checkRole([UserRole.ADMIN]),
  userController.getAllUsers
);

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Private
 */
router.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  param('id').isString().withMessage('Invalid user ID'),
  validateRequest,
  userController.getUserById
);

/**
 * @route PUT /api/users/:id
 * @desc Update user
 * @access Private
 */
router.put(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  [
    param('id').isString().withMessage('Invalid user ID'),
    body('name').optional(),
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    validateRequest,
  ],
  userController.updateUser
);

/**
 * @route PUT /api/users/:id/password
 * @desc Update user password
 * @access Private
 */
router.put(
  '/:id/password',
  passport.authenticate('jwt', { session: false }),
  [
    param('id').isString().withMessage('Invalid user ID'),
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long'),
    validateRequest,
  ],
  userController.updatePassword
);

/**
 * @route PUT /api/users/:id/preferences
 * @desc Update user preferences
 * @access Private
 */
router.put(
  '/:id/preferences',
  passport.authenticate('jwt', { session: false }),
  [
    param('id').isString().withMessage('Invalid user ID'),
    body('preferences').isObject().withMessage('Preferences must be an object'),
    validateRequest,
  ],
  userController.updatePreferences
);

/**
 * @route DELETE /api/users/:id
 * @desc Delete user (admin only)
 * @access Private/Admin
 */
router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  checkRole([UserRole.ADMIN]),
  param('id').isString().withMessage('Invalid user ID'),
  validateRequest,
  userController.deleteUser
);

export default router;
