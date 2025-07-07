import { db } from '../../packages/database/db';
import { users } from '../../packages/database/schema/users';
import { eq } from 'drizzle-orm';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { User } from '../../packages/database/types';

export class MfaService {
  constructor(private readonly db: typeof db) {}

  async setupMfa(userId: string) {
    const [user] = await this.db.select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      throw new Error('User not found');
    }

    const secret = speakeasy.generateSecret();
    const qrCode = await qrcode.toDataURL(`otpauth://totp/${user.email}?secret=${secret.base32}`);

    await this.db.update(users)
      .set({ 
        mfaEnabled: true,
        mfaSecret: secret.base32
      })
      .where(eq(users.id, userId));

    return {
      secret: secret.base32,
      qrCode
    };
  }

  async verifyMfa(userId: string, token: string): Promise<boolean> {
    const [user] = await this.db.select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.mfaEnabled || !user.mfaSecret) {
      return false;
    }

    return speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token
    });
  }

  async disableMfa(userId: string) {
    await this.db.update(users)
      .set({
        mfaSecret: null,
        mfaEnabled: false
      })
      .where(eq(users.id, userId));
  }
} 