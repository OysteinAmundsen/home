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

export type RegisterRequestBody = {
  credential: RegisterRequestCredential;
};

export interface RegisterRequestCredential {
  rawId: string;
  response: RegisterRequestCredentialResponse;
}

export interface RegisterRequestCredentialResponse {
  attestationObject: string;
  clientDataJSON: string;
}

export interface GetRegistrationOptionsResponse {
  token: string;
  options: PublicKeyCredentialCreationOptions;
}
