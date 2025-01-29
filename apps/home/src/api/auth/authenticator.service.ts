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
    return new TextDecoder().decode(new Uint8Array(buf).buffer);
  }

  private stringToArrayBuffer(str: string): ArrayBuffer {
    return new Uint8Array(Buffer.from(str, 'base64')).buffer;
  }

  /**
   * Create options for a registration challenge
   *
   * @returns
   */
  async getRegistrationOptions(): Promise<PublicKeyCredentialCreationOptions> {
    const registrationOptions = await this.fido.attestationOptions();
    const retObj = Object.assign(registrationOptions, {
      user: { id: crypto.randomBytes(32) },
      challenge: Buffer.from(registrationOptions.challenge),
      // iOS
      authenticatorSelection: { authenticatorAttachment: 'platform' },
    });
    return retObj;
  }

  /**
   * Do a credential registration
   *
   * @param challenge
   * @param credential
   * @param session
   * @returns
   */
  async doRegister(
    credential: RegisterRequestCredential,
    session: Record<string, any>,
  ): Promise<boolean> {
    try {
      const challenge = this.arrayBufferToString(session.challenge.data);
      const regResult = await this.fido.attestationResult(
        {
          rawId: this.stringToArrayBuffer(credential.rawId as string),
          response: {
            attestationObject: base64url.decode(
              credential.response.attestationObject,
              'base64',
            ),
            clientDataJSON: base64url.decode(
              credential.response.clientDataJSON,
              'base64',
            ),
          },
        },
        {
          challenge,
          origin,
          factor: 'either' as Factor,
        },
      );

      session.publicKey = regResult.authnrData.get('credentialPublicKeyPem');
      session.prevCounter = regResult.authnrData.get('counter');

      return true;
    } catch (e) {
      console.log('error', e);
      return false;
    }
  }

  /**
   *
   * @returns
   */
  async getAuthenticationOptions() {
    const authnOptions = await this.fido.assertionOptions();
    const retObj = Object.assign(authnOptions, {
      challenge: Buffer.from(authnOptions.challenge),
    });
    return retObj;
  }

  /**
   *
   * @param credential
   * @param session
   */
  async doAuthenticate(
    credential: any,
    session: Record<string, any>,
  ): Promise<Fido2AssertionResult> {
    credential.rawId = this.stringToArrayBuffer(credential.rawId);
    const challenge = this.arrayBufferToString(session.challenge.data);
    const { publicKey, prevCounter } = session;

    if (publicKey === 'undefined' || prevCounter === undefined) {
      throw 'No public key or counter found in session';
    } else {
      const result = await this.fido.assertionResult(credential, {
        challenge,
        origin,
        factor: 'either',
        publicKey,
        prevCounter,
        userHandle: this.arrayBufferToString(session.userHandle),
      });
      return result;
    }
  }
}
