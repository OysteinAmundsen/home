import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Post,
  Session,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import type { RegisterRequestBody } from './authenticator.model';
import { AuthenticatorService } from './authenticator.service';

/**
 * The controller for the /api/widgets route.
 *
 * @param server
 */
@ApiTags('auth')
@Controller('api/auth')
export class AuthenticatorController {
  constructor(private authService: AuthenticatorService) {}

  @Get('registration-options')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Registration options retreived.',
  })
  async getRegistrationOptions(@Session() session: Record<string, any>) {
    return await this.authService.getRegistrationOptions(session);
  }

  @Post('register')
  @ApiResponse({ status: HttpStatus.OK, description: 'Registerred.' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Failed to register.',
  })
  async register(
    @Session() session: Record<string, any>,
    @Body() body: RegisterRequestBody,
    @Headers() headers: Record<string, string>,
  ) {
    const result = await this.authService.doRegister(
      body.credential,
      session,
      headers['origin'] || '',
    );
    if (result) {
      return { status: 'ok' };
    } else {
      throw new HttpException('Failed to register', HttpStatus.BAD_REQUEST);
    }
  }

  @Get('authentication-options')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Authentication options retreived.',
  })
  async getAuthenticationOptions(@Session() session: Record<string, any>) {
    return await this.authService.getAuthenticationOptions(session);
  }

  @Post('authenticate')
  @ApiResponse({ status: HttpStatus.OK, description: 'Authenticated.' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Failed to authenticate.',
  })
  async authenticate(
    @Session() session: Record<string, any>,
    @Body() body: any,
  ) {
    try {
      return await this.authService.doAuthenticate(body.credential, session);
    } catch (error: any) {
      console.log(error);
      throw new HttpException(error, HttpStatus.FORBIDDEN);
    }
  }
}
