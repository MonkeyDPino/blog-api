import {
  Controller,
  Post,
  Req,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { type Request } from 'express';
import { AuthService } from '../services/auth.service';
import { User } from '../../users/entities/user.entity';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'password123' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Login successful — returns user, JWT access token, and refresh token',
    schema: {
      type: 'object',
      properties: {
        user: { $ref: '#/components/schemas/User' },
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        refreshToken: {
          type: 'object',
          properties: {
            tokenId: { type: 'string', example: 'uuid-here' },
            tokenValue: { type: 'string', example: 'hex-value-here' },
            expiresAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Req() req: Request) {
    const user = req.user as User;
    return this.authService.login(user);
  }

  @ApiOperation({ summary: 'Refresh access token using a refresh token' })
  @ApiResponse({
    status: 200,
    description: 'New access and refresh tokens issued',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: {
          type: 'object',
          properties: {
            tokenId: { type: 'string' },
            tokenValue: { type: 'string' },
            expiresAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @Post('refresh')
  refreshTokens(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout — revoke a refresh token' })
  @ApiResponse({ status: 204, description: 'Logged out successfully' })
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(@Body() dto: RefreshTokenDto): Promise<void> {
    return this.authService.logout(dto);
  }
}
