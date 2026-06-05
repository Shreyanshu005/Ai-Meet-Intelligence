import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';

export class AuthService {
  async register(email: string, passwordHash: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error('User already exists');
    }

    const hashed = await bcrypt.hash(passwordHash, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash: hashed },
    });

    const token = this.generateToken(user.id);
    return { user: { id: user.id, email: user.email }, token };
  }

  async login(email: string, passwordHash: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(passwordHash, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user.id);
    return { user: { id: user.id, email: user.email }, token };
  }

  private generateToken(userId: string) {
    return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '7d' });
  }
}

export const authService = new AuthService();
