import { ApiProperty } from '@nestjs/swagger';
import type { AuthenticatorTransportFuture, Base64URLString, CredentialDeviceType } from '@simplewebauthn/server';
import { User } from './user.entity';

/**
 *
 */
type Passkey = {
  id: Base64URLString;
  publicKey: Uint8Array;
  user: User;
  webauthnUserID: Base64URLString;
  counter: number;
  deviceType: CredentialDeviceType;
  backedUp: boolean;
  transports?: AuthenticatorTransportFuture[];
};

export class RegisterRequestCredentialResponse {
  @ApiProperty({ description: 'The attestation object', type: 'string' })
  attestationObject!: string;

  @ApiProperty({ description: 'The client data JSON', type: 'string' })
  clientDataJSON!: string;

  @ApiProperty({ description: 'The credential ID', type: 'string' })
  id!: string;

  @ApiProperty({ description: 'The credential type', type: 'string' })
  type!: string;
}

export class RegisterRequestCredential {
  @ApiProperty({ description: 'The raw ID of the credential', type: 'string' })
  rawId!: string;

  @ApiProperty({ description: 'The response object for the credential', type: RegisterRequestCredentialResponse })
  response!: RegisterRequestCredentialResponse;
}

export class PublicKeyCredentialUserEntityJSON {
  @ApiProperty({ description: 'The user ID as a Uint8Array', type: 'string' })
  id!: string;

  @ApiProperty({ description: 'The username of the user', type: 'string' })
  name!: string;

  @ApiProperty({ description: 'The display name of the user', type: 'string' })
  displayName!: string;
}

export class RegisterRequestBody {
  @ApiProperty({ description: 'The credential for registration', type: RegisterRequestCredential })
  credential!: RegisterRequestCredential;

  @ApiProperty({ description: 'Data for the user entity', type: PublicKeyCredentialUserEntityJSON })
  user!: PublicKeyCredentialUserEntityJSON;
}

export class AuthenticateRequestCredentialResponse {
  @ApiProperty({ description: 'The authenticator data', type: 'string' })
  authenticatorData!: string;

  @ApiProperty({ description: 'The signature', type: 'string' })
  signature!: string;

  @ApiProperty({ description: 'The user handle', type: 'string', required: false })
  userHandle?: string;

  @ApiProperty({ description: 'The client data JSON', type: 'string' })
  clientDataJSON!: string;
}

export class AuthenticateRequestCredential {
  @ApiProperty({ description: 'The raw ID of the credential', type: 'string' })
  rawId!: string;

  @ApiProperty({ description: 'The response object for the credential', type: AuthenticateRequestCredentialResponse })
  response!: AuthenticateRequestCredentialResponse;
}

export class AuthenticateRequestBody {
  @ApiProperty({ description: 'The credential for authentication', type: AuthenticateRequestCredential })
  credential!: AuthenticateRequestCredential;
}

export class AuthSessionData {
  @ApiProperty({ description: 'The user handle', type: 'string' })
  userHandle!: string;
  @ApiProperty({
    description: 'The challenge',
    type: 'object',
    properties: { type: { type: 'string', example: 'Buffer' } },
  })
  challenge!: ArrayBuffer;
}

export class AuthenticatorSelectionCriteriaImpl implements AuthenticatorSelectionCriteria {
  @ApiProperty({ type: 'string', example: 'platform' })
  authenticatorAttachment?: AuthenticatorAttachment;
  requireResidentKey?: boolean;
  residentKey?: ResidentKeyRequirement;
  userVerification?: UserVerificationRequirement;
}

export class RegistrationOptionsResponse implements PublicKeyCredentialCreationOptions {
  @ApiProperty({
    example: [{ type: 'public-key', alg: -7 }],
    description: 'The public key credential parameters',
    type: Array,
  })
  pubKeyCredParams!: PublicKeyCredentialParameters[];

  @ApiProperty({
    type: 'object',
    properties: {
      name: { type: 'string', example: 'Personal playground' },
      id: { type: 'string', example: 'localhost' },
      icon: { type: 'string', example: '/icons/icon-512.png' },
    },
  })
  rp!: PublicKeyCredentialRpEntity;

  @ApiProperty({
    description: 'The registration options',
    type: 'object',
    properties: { type: { type: 'string', example: 'Buffer' }, data: { type: 'array', example: [0] } },
  })
  challenge!: BufferSource;

  @ApiProperty({
    description: 'The user entity',
    type: 'object',
    properties: {
      id: {
        type: 'object',
        properties: { type: { type: 'string', example: 'Buffer' }, data: { type: 'array', example: [0] } },
      },
    },
  })
  user!: PublicKeyCredentialUserEntity;

  @ApiProperty({ description: 'Needed to satisfy iOS', type: AuthenticatorSelectionCriteriaImpl })
  authenticatorSelection!: AuthenticatorSelectionCriteriaImpl;

  @ApiProperty({ description: 'The timeout for registration', type: 'number', example: 60000 })
  timeout?: number;
}

export class AuthenticationOptions {
  @ApiProperty({ description: 'The challenge base64 encoded', type: 'string' })
  challenge!: string;
  @ApiProperty({ description: 'The allowed credentials', type: 'array' })
  allowCredentials!: PublicKeyCredentialDescriptor[];
}
export class AuthenticationOptionsResponse {
  @ApiProperty({
    description: 'The authentication options',
    type: AuthenticationOptions,
  })
  options!: AuthenticationOptions;
}

export class RegisterResponse {
  @ApiProperty({ description: 'The status of the registration', example: 'ok', type: 'string' })
  status!: string;
}

export class AuthenticateResponse {
  @ApiProperty({
    description: 'The JWT token',
    type: 'string',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  token!: string;
}
