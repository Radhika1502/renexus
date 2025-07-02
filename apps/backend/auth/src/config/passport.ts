import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import bcrypt from 'bcryptjs';
import { UserService } from '../services/user.service';

/**
 * Configure Passport authentication strategies
 */
export const configurePassport = (passport: passport.PassportStatic): void => {
  // Local Strategy for username/password authentication
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email, password, done) => {
        try {
          const userService = new UserService();
          const user = await userService.findByEmail(email);

          if (!user) {
            return done(null, false, { message: 'Invalid email or password' });
          }

          // Compare password
          const isMatch = await bcrypt.compare(password, user.passwordHash);
          if (!isMatch) {
            return done(null, false, { message: 'Invalid email or password' });
          }

          // Remove sensitive data before returning user
          const { passwordHash, ...userWithoutPassword } = user;
          return done(null, userWithoutPassword);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // JWT Strategy for token authentication
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
      },
      async (jwtPayload, done) => {
        try {
          const userService = new UserService();
          const user = await userService.findById(jwtPayload.sub);

          if (!user) {
            return done(null, false);
          }

          // Remove sensitive data before returning user
          const { passwordHash, ...userWithoutPassword } = user;
          return done(null, userWithoutPassword);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
};
