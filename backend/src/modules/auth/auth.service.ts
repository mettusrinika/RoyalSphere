import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import {
  User,
  UserDocument,
  UserStatus,
} from '../users/schemas/user.schema';

import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto/auth.dto';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.userModel.findOne({ email });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const verificationToken = this.generateSecureToken();
    const hashedVerificationToken =
      this.hashToken(verificationToken);

    const verificationExpiry = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    );

    const user = await this.userModel.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email,
      password: hashedPassword,
      role: 'customer',
      isVendorApproved: false,
      phone: dto.phone,
      emailVerified: false,
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpiry: verificationExpiry,
      status: UserStatus.PENDING_VERIFICATION,
    });

    try {
      await this.notificationsService.sendEmailVerification(
        user.email,
        user.firstName,
        verificationToken,
      );
    } catch (error) {
      await this.userModel.findByIdAndDelete(user._id);

      throw new BadRequestException(
        'Unable to send verification email. Please try again.',
      );
    }

    return {
      message:
        'Account created. Please check your email and verify your account before logging in.',
      email: user.email,
      requiresEmailVerification: true,
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.userModel
      .findOne({ email })
      .select('+password +refreshTokens');

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const isMatch = await bcrypt.compare(
      dto.password,
      user.password,
    );

    if (!isMatch) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    if (user.status === UserStatus.SUSPENDED) {
  throw new UnauthorizedException(
    'Account suspended. Contact support.',
  );
}

if (user.status === UserStatus.DELETED) {
  throw new UnauthorizedException(
    'Account no longer exists.',
  );
}

    if (
      !user.emailVerified ||
      user.status === UserStatus.PENDING_VERIFICATION
    ) {
      throw new UnauthorizedException(
        'Please verify your email before logging in.',
      );
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(
        'Account is not active.',
      );
    }

    user.lastLoginAt = new Date();

    const tokens = await this.generateTokens(user);

    const hashedRefresh = await bcrypt.hash(
      tokens.refreshToken,
      10,
    );

    user.refreshTokens = [
      ...(user.refreshTokens ?? []),
      hashedRefresh,
    ];

    await user.save();

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ) {
    const user = await this.userModel
      .findById(userId)
      .select('+refreshTokens');

    if (!user || !user.refreshTokens?.length) {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    if (
      !user.emailVerified ||
      user.status !== UserStatus.ACTIVE
    ) {
      throw new UnauthorizedException(
        'Account is not active',
      );
    }

    let matchedTokenIndex = -1;

    for (
      let index = 0;
      index < user.refreshTokens.length;
      index++
    ) {
      const match = await bcrypt.compare(
        refreshToken,
        user.refreshTokens[index],
      );

      if (match) {
        matchedTokenIndex = index;
        break;
      }
    }

    if (matchedTokenIndex === -1) {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    const tokens = await this.generateTokens(user);

    const hashedRefresh = await bcrypt.hash(
      tokens.refreshToken,
      10,
    );

    user.refreshTokens.splice(matchedTokenIndex, 1);
    user.refreshTokens.push(hashedRefresh);

    await user.save();

    return tokens;
  }

  async logout(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, {
      $set: {
        refreshTokens: [],
      },
    });

    return {
      message: 'Logged out successfully',
    };
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException(
        'Verification token is required',
      );
    }

    const hashedToken = this.hashToken(token);

    const user = await this.userModel.findOne({
      emailVerificationToken: hashedToken,
    });

    if (!user) {
      throw new BadRequestException(
        'Invalid verification link',
      );
    }

    if (user.emailVerified) {
      throw new BadRequestException(
        'Email is already verified',
      );
    }

    if (
      !user.emailVerificationExpiry ||
      user.emailVerificationExpiry <= new Date()
    ) {
      throw new BadRequestException(
        'Verification link has expired. Please request a new verification email.',
      );
    }

    user.emailVerified = true;
    user.status = UserStatus.ACTIVE;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;

    await user.save();

    return {
      message:
        'Email verified successfully. You can now log in.',
    };
  }

  async resendVerification(emailInput: string) {
    const email = emailInput.trim().toLowerCase();

    const user = await this.userModel.findOne({
      email,
    });

    /*
     * Do not reveal whether an email exists.
     */
    if (!user) {
      return {
        message:
          'If the account exists and requires verification, a verification email has been sent.',
      };
    }

    if (user.emailVerified) {
      return {
        message:
          'If the account exists and requires verification, a verification email has been sent.',
      };
    }

    /*
     * Current verification tokens live for 24 hours.
     * Require at least 60 seconds between resend attempts.
     */
    if (user.emailVerificationExpiry) {
      const tokenCreatedAt =
        user.emailVerificationExpiry.getTime() -
        24 * 60 * 60 * 1000;

      const secondsSinceCreated =
        (Date.now() - tokenCreatedAt) / 1000;

      if (secondsSinceCreated < 60) {
        throw new HttpException(
  'Please wait before requesting another verification email.',
  HttpStatus.TOO_MANY_REQUESTS,
);
      }
    }

    const verificationToken = this.generateSecureToken();

    user.emailVerificationToken =
      this.hashToken(verificationToken);

    user.emailVerificationExpiry = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    );

    user.status = UserStatus.PENDING_VERIFICATION;

    await user.save();

    try {
      await this.notificationsService.sendEmailVerification(
        user.email,
        user.firstName,
        verificationToken,
      );
    } catch (error) {
      throw new BadRequestException(
        'Unable to send verification email. Please try again.',
      );
    }

    return {
      message:
        'Verification email sent. Please check your inbox.',
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.userModel.findOne({
      email,
    });

    if (!user) {
      return {
        message:
          'If that email exists, a reset link was sent.',
      };
    }

    const token = this.generateSecureToken();

    user.passwordResetToken = this.hashToken(token);

    user.passwordResetExpiry = new Date(
      Date.now() + 60 * 60 * 1000,
    );

    await user.save();

    try {
      await this.notificationsService.sendPasswordReset(
        user.email,
        user.firstName,
        token,
      );
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpiry = undefined;

      await user.save();

      throw new BadRequestException(
        'Unable to send password reset email. Please try again.',
      );
    }

    return {
      message:
        'If that email exists, a reset link was sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (!dto.token) {
      throw new BadRequestException(
        'Reset token is required',
      );
    }

    const hashedToken = this.hashToken(dto.token);

    const user = await this.userModel
      .findOne({
        passwordResetToken: hashedToken,
        passwordResetExpiry: {
          $gt: new Date(),
        },
      })
      .select('+password +refreshTokens');

    if (!user) {
      throw new BadRequestException(
        'Invalid or expired reset link',
      );
    }

    user.password = await bcrypt.hash(
      dto.password,
      12,
    );

    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    user.refreshTokens = [];

    await user.save();

    return {
      message:
        'Password reset successfully. Please login.',
    };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ) {
    const user = await this.userModel
      .findById(userId)
      .select('+password +refreshTokens');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isMatch) {
      throw new BadRequestException(
        'Current password is incorrect',
      );
    }

    user.password = await bcrypt.hash(
      dto.newPassword,
      12,
    );

    user.refreshTokens = [];

    await user.save();

    return {
      message:
        'Password changed. Please login again.',
    };
  }

  private async generateTokens(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      isVendorApproved: user.isVendorApproved,
    };

    const [accessToken, refreshToken] =
      await Promise.all([
        this.jwtService.signAsync(payload, {
          secret:
            this.configService.get<string>('JWT_SECRET'),
          expiresIn:
            this.configService.get('JWT_EXPIRES_IN') ||
            '15m',
        }),
        this.jwtService.signAsync(payload, {
          secret:
            this.configService.get<string>(
              'JWT_REFRESH_SECRET',
            ),
          expiresIn:
            this.configService.get(
              'JWT_REFRESH_EXPIRES_IN',
            ) || '7d',
        }),
      ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private hashToken(token: string): string {
    return crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
  }

  private sanitizeUser(user: UserDocument) {
    const obj = user.toObject();

    delete obj.password;
    delete obj.refreshTokens;
    delete obj.emailVerificationToken;
    delete obj.emailVerificationExpiry;
    delete obj.passwordResetToken;
    delete obj.passwordResetExpiry;

    return obj;
  }
}