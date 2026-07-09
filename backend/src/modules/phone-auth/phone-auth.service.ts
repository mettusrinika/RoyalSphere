import {
  BadRequestException,
  Injectable,
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
import Twilio = require('twilio');
import {
  User,
  UserDocument,
  UserRole,
  UserStatus,
} from '../users/schemas/user.schema';

@Injectable()
export class PhoneAuthService {
  private readonly twilioClient: ReturnType<typeof Twilio>;
  private readonly verifyServiceSid: string;

  constructor(
    @InjectModel(User.name)
    private readonly users: Model<UserDocument>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    const accountSid =
      this.config.get<string>('TWILIO_ACCOUNT_SID');

    const authToken =
      this.config.get<string>('TWILIO_AUTH_TOKEN');

    const verifyServiceSid =
      this.config.get<string>('TWILIO_VERIFY_SERVICE_SID');

    if (!accountSid || !authToken || !verifyServiceSid) {
      throw new Error(
        'Twilio Verify configuration is incomplete',
      );
    }

    this.twilioClient = Twilio(accountSid, authToken);
    this.verifyServiceSid = verifyServiceSid;
  }

  private normalize(phone: string) {
    const value = String(phone ?? '').replace(/[^\d+]/g, '');

    const normalized = value.startsWith('+')
      ? value
      : value.length === 10
        ? `+91${value}`
        : `+${value}`;

    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
      throw new BadRequestException(
        'Enter a valid mobile number with country code',
      );
    }

    return normalized;
  }

  async requestOtp(rawPhone: string) {
    const phone = this.normalize(rawPhone);

    let user = await this.users
      .findOne({ phone })
      .select(
        '+phoneOtpAttempts +phoneOtpLastSentAt',
      );

    if (
      user?.phoneOtpLastSentAt &&
      Date.now() - user.phoneOtpLastSentAt.getTime() < 60_000
    ) {
      throw new HttpException(
        'Please wait before requesting another OTP',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!user) {
      const placeholder =
        `phone-${crypto.randomUUID()}@pending.omiqora.local`;

      user = await this.users.create({
        firstName: 'OMIQORA',
        lastName: 'User',
        email: placeholder,
        password: await bcrypt.hash(
          crypto.randomBytes(32).toString('hex'),
          12,
        ),
        phone,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        emailVerified: false,
        phoneVerified: false,
      });
    }

    try {
      await this.twilioClient.verify.v2
        .services(this.verifyServiceSid)
        .verifications.create({
          to: phone,
          channel: 'sms',
        });
    } catch {
      throw new BadRequestException(
        'Unable to send verification code. Please try again.',
      );
    }

    user.phoneOtpAttempts = 0;
    user.phoneOtpLastSentAt = new Date();

    user.phoneOtpHash = undefined;
    user.phoneOtpExpiry = undefined;

    await user.save();

    return {
      message: 'Verification code sent by SMS',
      expiresInSeconds: 600,
    };
  }

  async verifyOtp(rawPhone: string, otp: string) {
    const phone = this.normalize(rawPhone);

    const code = String(otp ?? '').trim();

    if (!/^\d{4,10}$/.test(code)) {
      throw new BadRequestException(
        'Enter a valid verification code',
      );
    }

    const localPhone = phone.replace(/^\+91/, '');

    let user = await this.users
      .findOne({
        phone: { $in: [phone, localPhone] },
        email: {
          $not: /@pending\.omiqora\.local$/i,
        },
      })
      .select(
        '+phoneOtpAttempts +phoneOtpLastSentAt +refreshTokens',
      );

    if (!user) {
      user = await this.users
        .findOne({
          phone: { $in: [phone, localPhone] },
        })
        .select(
          '+phoneOtpAttempts +phoneOtpLastSentAt +refreshTokens',
        );
    }

    if (!user?.phoneOtpLastSentAt) {
      throw new UnauthorizedException(
        'Request an OTP first',
      );
    }

    if ((user.phoneOtpAttempts ?? 0) >= 5) {
      throw new HttpException(
        'Too many OTP attempts',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    let approved = false;

    try {
      const result = await this.twilioClient.verify.v2
        .services(this.verifyServiceSid)
        .verificationChecks.create({
          to: phone,
          code,
        });

      approved = result.status === 'approved';
    } catch {
      approved = false;
    }

    if (!approved) {
      user.phoneOtpAttempts =
        (user.phoneOtpAttempts ?? 0) + 1;

      await user.save();

      throw new UnauthorizedException(
        'Invalid or expired OTP',
      );
    }

    user.phoneVerified = true;
    user.status = UserStatus.ACTIVE;
    user.phoneOtpHash = undefined;
    user.phoneOtpExpiry = undefined;
    user.phoneOtpAttempts = 0;
    user.phoneOtpLastSentAt = undefined;
    user.lastLoginAt = new Date();

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      isVendorApproved: user.isVendorApproved,
    };

    const accessToken = await this.jwt.signAsync(
      payload,
      {
        secret:
          this.config.get<string>('JWT_SECRET'),
        expiresIn:
          this.config.get('JWT_EXPIRES_IN') || '15m',
      },
    );

    const refreshToken = await this.jwt.signAsync(
      payload,
      {
        secret:
          this.config.get<string>(
            'JWT_REFRESH_SECRET',
          ),
        expiresIn:
          this.config.get(
            'JWT_REFRESH_EXPIRES_IN',
          ) || '7d',
      },
    );

    user.refreshTokens = [
      ...(user.refreshTokens ?? []),
      await bcrypt.hash(refreshToken, 10),
    ];

    await user.save();

    const obj: any = user.toObject();

    for (const key of [
      'password',
      'refreshTokens',
      'phoneOtpHash',
      'phoneOtpExpiry',
      'phoneOtpAttempts',
      'phoneOtpLastSentAt',
      'emailVerificationToken',
      'emailVerificationExpiry',
      'passwordResetToken',
      'passwordResetExpiry',
    ]) {
      delete obj[key];
    }

    return {
      user: obj,
      accessToken,
      refreshToken,
      requiresProfileCompletion:
        !obj.profileCompleted,
    };
  }
}
