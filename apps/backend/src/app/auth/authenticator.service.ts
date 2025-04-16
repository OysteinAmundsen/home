import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import base64url from 'base64url';
import crypto from 'crypto';
import { Factor, Fido2Lib } from 'fido2-lib';
import { Repository } from 'typeorm';
import { RegisterRequestBody } from './authenticator.model';
import { JwtAge, JWTHandler } from './jwt';
import { User } from './user.entity';

/**
 * https://github.com/DannyMoerkerke/webauthn-demo/blob/master/server/webauthn-server.js
 */
@Injectable()
export class AuthenticatorService {
  constructor(
    @InjectRepository(User)
    private credentialRepository: Repository<User>,
  ) {}

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

  /**
   * Create options for a registration challenge
   *
   * @returns
   */
  async getRegistrationOptions(session: Record<string, any>): Promise<PublicKeyCredentialCreationOptions> {
    const registrationOptions = await this.fido.attestationOptions();
    const userIdBuffer = crypto.randomBytes(32); // Generate random bytes for user ID
    const userIdBase64 = userIdBuffer.toString('base64'); // Convert to Base64 string

    const retObj = Object.assign(registrationOptions, {
      user: { id: userIdBuffer },
      challenge: Buffer.from(registrationOptions.challenge),
      // iOS
      authenticatorSelection: { authenticatorAttachment: 'platform' },
    });

    // Add challenge and user to the session
    session.challenge = registrationOptions.challenge;
    session.userHandle = userIdBase64;

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
  async doRegister(body: RegisterRequestBody, session: Record<string, any>, origin: string): Promise<boolean> {
    const challenge: ArrayBuffer = new Uint8Array(session.challenge.data).buffer;
    const regResult = await this.fido.attestationResult(
      {
        rawId: new Uint8Array(Buffer.from(body.credential.rawId, 'base64')).buffer,
        response: {
          attestationObject: base64url.decode(body.credential.response.attestationObject, 'base64'),
          clientDataJSON: base64url.decode(body.credential.response.clientDataJSON, 'base64'),
        },
      },
      {
        challenge: Buffer.from(challenge).toString('base64'),
        origin,
        factor: 'either' as Factor,
      },
    );

    // Persist the public key and counter in the database
    const credentialEntity = this.credentialRepository.create({
      userId: session.userHandle,
      username: body.user.displayName,
      email: body.user.name,
      publicKey: regResult.authnrData.get('credentialPublicKeyPem'),
      counter: regResult.authnrData.get('counter'),
    });
    await this.credentialRepository.save(credentialEntity);

    return true;
  }

  /**
   *
   * @returns
   */
  async getAuthenticationOptions(session: Record<string, unknown>) {
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
  async doAuthenticate(credential: any, session: Record<string, any>, origin: string): Promise<{ token: string }> {
    credential.rawId = new Uint8Array(Buffer.from(credential.rawId, 'base64')).buffer;
    const challenge = new Uint8Array(session.challenge.data).buffer;

    // Retrieve the public key and counter from the database
    const userHandle = credential.response.userHandle.toString('base64');
    const storedCredential = await this.credentialRepository.findOneBy({ userId: userHandle });

    if (!storedCredential) {
      throw new Error('No credentials found for user');
    }

    const assertionResult = await this.fido.assertionResult(credential, {
      challenge: Buffer.from(challenge).toString('base64'),
      origin,
      factor: 'either',
      publicKey: storedCredential.publicKey,
      prevCounter: storedCredential.counter || 0,
      userHandle: storedCredential.userId, // Use the stored userHandle
    });

    // Generate JWT token
    const jwt = new JWTHandler();
    const token = await jwt.sign(
      {
        userId: storedCredential.userId,
        username: storedCredential.username,
        email: storedCredential.email,
      },
      JwtAge.LONG,
    );
    return { token };
  }
}
