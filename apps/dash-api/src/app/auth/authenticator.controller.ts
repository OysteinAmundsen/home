import { Body, Controller, Get, Headers, HttpException, HttpStatus, Logger, Post, Session } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiForbiddenResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuthenticateRequestBody,
  AuthenticateResponse,
  AuthenticationOptionsResponse,
  AuthSessionData,
  RegisterRequestBody,
  RegisterResponse,
  RegistrationOptionsResponse,
} from './authenticator.model';
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
  @ApiOperation({
    summary: 'Get registration options. This sets up a session cookie and returns a temporary user id.',
  })
  @ApiOkResponse({ description: 'Registration options retreived.', type: RegistrationOptionsResponse })
  async getRegistrationOptions(@Session() session: AuthSessionData) {
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
  @ApiOperation({ summary: 'Register user credentials. ' })
  @ApiOkResponse({ description: 'Registered.', type: RegisterResponse })
  @ApiBadRequestResponse({ description: 'Failed to register.' })
  @ApiBody({ description: 'Registration request body', type: RegisterRequestBody })
  @ApiHeader({ name: 'origin', description: 'Origin header', required: true, example: 'https://example.com' })
  async register(
    @Session() session: AuthSessionData,
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
  @ApiOperation({ summary: 'Get authentication options' })
  @ApiOkResponse({ description: 'Authentication options retreived.', type: AuthenticationOptionsResponse })
  async getAuthenticationOptions(@Session() session: AuthSessionData) {
    return await this.authService.getAuthenticationOptions(session);
  }

  /**
   *
   * @param session
   * @param body
   * @returns
   */
  @Post('authenticate')
  @ApiOperation({ summary: 'Authenticate user credentials' })
  @ApiOkResponse({ description: 'Authenticated.', type: AuthenticateResponse })
  @ApiForbiddenResponse({ description: 'Failed to authenticate.' })
  @ApiBody({ description: 'Authentication request body', type: AuthenticateRequestBody })
  @ApiHeader({ name: 'origin', description: 'Origin header', required: true, example: 'https://example.com' })
  async authenticate(
    @Session() session: AuthSessionData,
    @Headers() headers: Record<string, string>,
    @Body() body: AuthenticateRequestBody,
  ) {
    try {
      return await this.authService.doAuthenticate(body.credential, session, headers['origin'] || '');
    } catch (error: any) {
      throw new HttpException(error, HttpStatus.FORBIDDEN);
    }
  }
}
