import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '@product-ops-agent/database';
import { AuthToken, LoginRequest, RegisterRequest, User, UserRole } from '../../types/auth';

const JWT_SECRET = process.env.AUTH_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRY = (process.env.JWT_EXPIRY || '24h') as string;
const SALT_ROUNDS = 10;

export class AuthService {
  async register(data: RegisterRequest): Promise<{ user: User; token: string }> {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: data.role || UserRole.USER,
      },
    });

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async login(data: LoginRequest): Promise<{ user: User; token: string }> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  generateToken(payload: AuthToken): string {
    return jwt.sign(payload as object, JWT_SECRET, { expiresIn: JWT_EXPIRY as jwt.SignOptions['expiresIn'] });
  }

  verifyToken(token: string): AuthToken {
    try {
      return jwt.verify(token, JWT_SECRET) as AuthToken;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();
