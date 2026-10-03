import { Body, Controller, Get, Ip, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RequestOtpDto } from './dto/request-otp.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { StaffLoginDto } from './dto/staff-login.dto.js';
import { JwtAuthGuard, type AuthenticatedRequest } from './jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('request-otp')
  requestOtp(@Body() dto: RequestOtpDto, @Ip() ip: string) {
    return this.auth.requestOtp(dto, ip);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto);
  }

  @Post('staff-login')
  staffLogin(@Body() dto: StaffLoginDto) {
    return this.auth.staffLogin(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: AuthenticatedRequest) {
    return this.auth.me(req.userId!);
  }
}
