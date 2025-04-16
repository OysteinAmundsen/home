import { Body, Controller, Get, Headers, HttpException, HttpStatus, Logger, Post, Session } from '@nestjs/common';
import { ApiBadRequestResponse, ApiForbiddenResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { RegisterRequestBody } from './authenticator.model';
import { AuthenticatorService } from './authenticator.service';

/**
 * The controller for the authenticator routes.
 *
 * This wraps the authenticator service in http routes.
 *
 * @param server
 */
@ApiTags('auth')
@Controller('api/auth')
export class AuthenticatorController {
  constructor(private authService: AuthenticatorService) {}

  /**
   *
   * @param session
   * @returns
   */
  @Get('register')
  @ApiOkResponse({ description: 'Registration options retreived.' })
  async getRegistrationOptions(@Session() session: Record<string, unknown>) {
    return await this.authService.getRegistrationOptions(session);
  }

  /**
   *
   * @param session
   * @param body
   * @param headers
   * @returns
   */
  @Post('register')
  @ApiOkResponse({ description: 'Registerred.' })
  @ApiBadRequestResponse({ description: 'Failed to register.' })
  async register(
    @Session() session: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
    @Body() body: RegisterRequestBody,
  ) {
    try {
      const result = await this.authService.doRegister(body, session, headers['origin'] || '');
      return { status: result ? 'ok' : 'failed' };
    } catch (error: any) {
      Logger.error(error);
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   *
   * @param session
   * @returns
   */
  @Get('authenticate')
  @ApiOkResponse({ description: 'Authentication options retreived.' })
  async getAuthenticationOptions(@Session() session: Record<string, unknown>) {
    return await this.authService.getAuthenticationOptions(session);
  }

  /**
   *
   * @param session
   * @param body
   * @returns
   */
  @Post('authenticate')
  @ApiOkResponse({ description: 'Authenticated.' })
  @ApiForbiddenResponse({ description: 'Failed to authenticate.' })
  async authenticate(
    @Session() session: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
    @Body() body: any,
  ) {
    try {
      return await this.authService.doAuthenticate(body.credential, session, headers['origin'] || '');
    } catch (error: any) {
      throw new HttpException(error, HttpStatus.FORBIDDEN);
    }
  }
}
