import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthService } from './auth.service';

import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RefreshTokenDto,
  ChangePasswordDto,
} from './dto/auth.dto';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login',
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh authentication tokens',
  })
  refresh(@Body() dto: RefreshTokenDto) {
    try {
      const tokenParts =
        dto.refreshToken.split('.');

      if (tokenParts.length !== 3) {
        throw new UnauthorizedException(
          'Invalid refresh token',
        );
      }

      const payload = JSON.parse(
        Buffer.from(
          tokenParts[1],
          'base64url',
        ).toString('utf8'),
      );

      if (!payload?.sub) {
        throw new UnauthorizedException(
          'Invalid refresh token',
        );
      }

      return this.authService.refreshTokens(
        String(payload.sub),
        dto.refreshToken,
      );
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout',
  })
  logout(@Request() req) {
    return this.authService.logout(
      req.user._id.toString(),
    );
  }

  @Get('verify-email/:token')
  @ApiOperation({
    summary: 'Verify email address',
  })
  verifyEmail(
    @Param('token') token: string,
  ) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend email verification link',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'customer@example.com',
        },
      },
    },
  })
  resendVerification(
    @Body('email') email: string,
  ) {
    if (
      !email ||
      typeof email !== 'string'
    ) {
      throw new UnauthorizedException(
        'Email is required',
      );
    }

    return this.authService.resendVerification(
      email,
    );
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
  })
  forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password',
  })
  resetPassword(
    @Body() dto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(dto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change authenticated user password',
  })
  changePassword(
    @Request() req,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      req.user._id.toString(),
      dto,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current authenticated user',
  })
  getMe(@Request() req) {
    return {
      user: req.user,
    };
  }
}