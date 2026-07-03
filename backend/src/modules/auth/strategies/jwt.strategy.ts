import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
  private configService: ConfigService,
  @InjectModel(User.name)
  private userModel: Model<UserDocument>,
) {
  const jwtSecret = configService.get<string>('JWT_SECRET');

  console.log('JWT_SECRET =', jwtSecret);

  super({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    ignoreExpiration: false,
    secretOrKey: jwtSecret,
  });
}

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.userModel
      .findById(payload.sub)
      .select('-password -refreshTokens -emailVerificationToken -passwordResetToken');

    if (!user || user.status === 'suspended') {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}
