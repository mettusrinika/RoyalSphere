import {
  BadRequestException,
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import {
  User,
  UserDocument,
  UserRole,
  UserStatus,
} from '../users/schemas/user.schema';

@Injectable()
export class PhoneAuthService {
  private readonly logger = new Logger(PhoneAuthService.name);

  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private normalize(phone: string) {
    const value = String(phone ?? '').replace(/[^\d+]/g, '');
    const normalized = value.startsWith('+')
      ? value
      : value.length === 10
        ? `+91${value}`
        : `+${value}`;
    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
      throw new BadRequestException('Enter a valid mobile number with country code');
    }
    return normalized;
  }

  async requestOtp(rawPhone: string) {
    const phone = this.normalize(rawPhone);
    let user = await this.users.findOne({ phone }).select(
      '+phoneOtpHash +phoneOtpExpiry +phoneOtpAttempts +phoneOtpLastSentAt',
    );

    if (user?.phoneOtpLastSentAt &&
        Date.now() - user.phoneOtpLastSentAt.getTime() < 60_000) {
      throw new HttpException('Please wait before requesting another OTP', HttpStatus.TOO_MANY_REQUESTS);
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const hash = await bcrypt.hash(otp, 10);
    const expiry = new Date(Date.now() + 5 * 60_000);

    if (!user) {
      const placeholder = `phone-${crypto.randomUUID()}@pending.omiqora.local`;
      user = await this.users.create({
        firstName: 'OMIQORA',
        lastName: 'User',
        email: placeholder,
        password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12),
        phone,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        emailVerified: false,
        phoneVerified: false,
      });
    }

    user.phoneOtpHash = hash;
    user.phoneOtpExpiry = expiry;
    user.phoneOtpAttempts = 0;
    user.phoneOtpLastSentAt = new Date();
    await user.save();

    const provider = this.config.get<string>('OTP_PROVIDER') || 'development';
    if (provider === 'development') {
      if (this.config.get<string>('NODE_ENV') === 'production') {
        throw new BadRequestException('OTP provider is not configured');
      }
      this.logger.warn(`DEVELOPMENT OTP for ${phone}: ${otp}`);
      return {
        message: 'Development OTP generated',
        providerSetupRequired: true,
        developmentOtp: otp,
        expiresInSeconds: 300,
      };
    }

    throw new BadRequestException(
      `OTP provider "${provider}" is configured but no live adapter is installed`,
    );
  }

  async verifyOtp(rawPhone: string, otp: string) {
    const phone = this.normalize(rawPhone);
    const user = await this.users.findOne({ phone }).select(
      '+phoneOtpHash +phoneOtpExpiry +phoneOtpAttempts +refreshTokens',
    );

    if (!user?.phoneOtpHash || !user.phoneOtpExpiry) {
      throw new UnauthorizedException('Request an OTP first');
    }
    if (user.phoneOtpExpiry.getTime() < Date.now()) {
      throw new UnauthorizedException('OTP expired');
    }
    if ((user.phoneOtpAttempts ?? 0) >= 5) {
      throw new HttpException('Too many OTP attempts', HttpStatus.TOO_MANY_REQUESTS);
    }

    const ok = await bcrypt.compare(String(otp ?? ''), user.phoneOtpHash);
    if (!ok) {
      user.phoneOtpAttempts = (user.phoneOtpAttempts ?? 0) + 1;
      await user.save();
      throw new UnauthorizedException('Invalid OTP');
    }

    user.phoneVerified = true;
    user.status = UserStatus.ACTIVE;
    user.phoneOtpHash = undefined;
    user.phoneOtpExpiry = undefined;
    user.phoneOtpAttempts = 0;
    user.lastLoginAt = new Date();

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      isVendorApproved: user.isVendorApproved,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN') || '15m',
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    user.refreshTokens = [
      ...(user.refreshTokens ?? []),
      await bcrypt.hash(refreshToken, 10),
    ];
    await user.save();

    const obj: any = user.toObject();
    for (const key of [
      'password', 'refreshTokens', 'phoneOtpHash', 'phoneOtpExpiry',
      'phoneOtpAttempts', 'phoneOtpLastSentAt', 'emailVerificationToken',
      'emailVerificationExpiry', 'passwordResetToken', 'passwordResetExpiry',
    ]) delete obj[key];

    return {
      user: obj,
      accessToken,
      refreshToken,
      requiresProfileCompletion: !obj.profileCompleted,
    };
  }
}