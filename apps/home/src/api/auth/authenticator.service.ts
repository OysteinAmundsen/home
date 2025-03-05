import { Injectable } from '@nestjs/common';
import base64url from 'base64url';
import crypto from 'crypto';
import { Factor, Fido2AssertionResult, Fido2Lib } from 'fido2-lib';
import { RegisterRequestCredential } from './authenticator.model';

/**
 * https://github.com/DannyMoerkerke/webauthn-demo/blob/master/server/webauthn-server.js
 */
@Injectable()
export class AuthenticatorService {
  private fido = new Fido2Lib({
    timeout: 60000,
    rpId: 'localhost',
    rpName: 'Personal playground',
    rpIcon: '/icons/icon-512.png',
    challengeSize: 128,
    attestation: 'none',
    cryptoParams: [-7, -257],
    authenticatorAttachment: 'platform',
    authenticatorRequireResidentKey: false,
    authenticatorUserVerification: 'required',
  });

  private arrayBufferToString(buf: ArrayBuffer): string {
    return new TextDecoder().decode(buf);
  }

  /**
   * Create options for a registration challenge
   *
   * @returns
   */
  async getRegistrationOptions(session: Record<string, any>): Promise<PublicKeyCredentialCreationOptions> {
    const registrationOptions = await this.fido.attestationOptions();
    const retObj = Object.assign(registrationOptions, {
      user: { id: crypto.randomBytes(32) },
      challenge: Buffer.from(registrationOptions.challenge),
      // iOS
      authenticatorSelection: { authenticatorAttachment: 'platform' },
    });

    // Add challenge and user to the session
    session.challenge = registrationOptions.challenge;
    session.userHandle = registrationOptions.user.id;

    return retObj;
  }

  /**
   * Do a credential registration
   *
   * @param credential
   * @param session
   * @param origin
   *
   * @returns
   */
  async doRegister(
    credential: RegisterRequestCredential,
    session: Record<string, any>,
    origin: string,
  ): Promise<boolean> {
    const challenge: ArrayBuffer = new Uint8Array(session.challenge.data).buffer;
    const regResult = await this.fido.attestationResult(
      {
        rawId: new Uint8Array(Buffer.from(credential.rawId, 'base64')).buffer,
        response: {
          attestationObject: base64url.decode(credential.response.attestationObject, 'base64'),
          clientDataJSON: base64url.decode(credential.response.clientDataJSON, 'base64'),
        },
      },
      {
        challenge: Buffer.from(challenge).toString('base64'),
        origin,
        factor: 'either' as Factor,
      },
    );

    // Store the public key and counter in the session
    // We should probably store this in a longer term storage somewhere
    // and associate it with the user id
    session.publicKey = regResult.authnrData.get('credentialPublicKeyPem');
    session.prevCounter = regResult.authnrData.get('counter');

    return true;
  }

  /**
   *
   * @returns
   */
  async getAuthenticationOptions(session: Record<string, any>) {
    const authnOptions = await this.fido.assertionOptions();
    const authOptions = Object.assign(authnOptions, {
      challenge: Buffer.from(authnOptions.challenge),
    });

    // Add challenge to the session
    session.challenge = authOptions.challenge;

    return authOptions;
  }

  /**
   *
   * @param credential
   * @param session
   * @param origin
   */
  async doAuthenticate(credential: any, session: Record<string, any>, origin: string): Promise<Fido2AssertionResult> {
    credential.rawId = new Uint8Array(Buffer.from(credential.rawId, 'base64')).buffer;
    const challenge = new Uint8Array(session.challenge.data).buffer;
    const publicKey = session.publicKey;
    const prevCounter = session.prevCounter;
    const userHandle = new Uint8Array(session.userHandle).buffer;

    if (publicKey === 'undefined' || prevCounter === undefined) {
      throw 'No public key or counter found in session';
    } else {
      return await this.fido.assertionResult(credential, {
        challenge: this.arrayBufferToString(challenge),
        origin,
        factor: 'either',
        publicKey,
        prevCounter,
        userHandle: this.arrayBufferToString(userHandle),
      });
    }
  }
}
