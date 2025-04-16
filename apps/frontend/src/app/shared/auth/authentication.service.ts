import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, linkedSignal, PLATFORM_ID, signal } from '@angular/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { StorageService } from '@home/shared/browser/storage/storage.service';
import { base64ToBuffer, bufferToBase64 } from '@home/shared/utils/object';
import { firstValueFrom } from 'rxjs';

const CREDENTIALS_KEY = 'credentials';

/**
 * The WebAuthN authentication service
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API
 */
@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storage = inject(StorageService);

  /** The credential raw id stored in localStorage */
  credentials = linkedSignal(() => (isPlatformBrowser(this.platformId) ? this.storage.get(CREDENTIALS_KEY) : ''));

  /** Returns true if there exists credentials in localStorage */
  isRegistered = computed(() => !!this.credentials());

  /** Returns true if user is currently logged in */
  isLoggedIn = signal(false);

  /**
   * Set the credentials in localStorage and update the signal
   * @param rawId The raw ID of the credential
   */
  private setCredentials(rawId: string) {
    this.storage.set(CREDENTIALS_KEY, rawId);
    this.credentials.set(rawId);
  }

  /**
   * Remove the registration from the system
   *
   * NOTE: Webauthn does not currently support removing credentials, so we just
   * remove the credential from the local storage. Beware that registering and
   * removing credentials a lot of times will fill up your passkey storage.
   */
  removeCredentials() {
    this.storage.remove(CREDENTIALS_KEY);
    this.credentials.set('');
  }

  // #region Registration
  /**
   * Register a new user to the system
   *
   * This creates a key pair on the client and sends the public key to the server
   * to be stored. The private key is stored on the client and used to sign.
   * The private key is stored in the client's authenticator (i.e. Windows Hello)
   * and is unique to the site domain.
   *
   * @param userName The username to register
   * @param displayName The display name of the user
   */
  async register(userName: string, displayName: string) {
    try {
      // Step 1: Get the registration options from the server
      const options = await firstValueFrom(this.http.get<PublicKeyCredentialCreationOptions>(`/api/auth/register`));

      // Step 2 + 3: Get user consent and create the webauth credentials
      const user = {
        id: Uint8Array.from((options.user.id as any).data),
        name: userName,
        displayName: displayName,
      };
      const credential = (await navigator.credentials.create({
        publicKey: {
          ...options,
          challenge: new Uint8Array((options.challenge as any).data),
          user,
        },
      })) as PublicKeyCredential;

      // Step 4: Send the credential to the server
      await this.postCredentials(credential, user);
    } catch (ex) {
      console.error('Failed to register', ex);
    }
  }

  /**
   * Post the created credentials to the server
   * @param credential The public key credential to post
   */
  private async postCredentials(credential: PublicKeyCredential, user: PublicKeyCredentialUserEntity) {
    const rawId = bufferToBase64(credential.rawId);
    await firstValueFrom(
      this.http.post(
        `/api/auth/register`,
        {
          credential: {
            rawId,
            response: {
              attestationObject: bufferToBase64((credential.response as any).attestationObject),
              clientDataJSON: bufferToBase64(credential.response.clientDataJSON),
              id: credential.id,
              type: credential.type,
            },
          },
          user,
        },
        { withCredentials: true },
      ),
    );

    // Store a reference to the user id in localStorage
    // This, along with the public key, is used to retrieve the
    // credentials when authenticating
    this.setCredentials(rawId);
  }

  // #region Authentication
  /**
   * Authenticate the user
   */
  async authenticate() {
    try {
      // Get the server part of the authentication options
      const options = await firstValueFrom(this.http.get<PublicKeyCredentialRequestOptions>(`/api/auth/authenticate`));

      // Get the client part or our webauth credentials
      const credential = await this.getCredentials(options);

      // Do the actual authentication
      if (credential) {
        this.doAuthentication(credential);
      }
    } catch (ex) {
      console.error('failed to authenticate', ex);
    }
  }

  /**
   * Perform the actual authentication
   * @param credential The credential to use for authentication
   * @returns The result of the authentication
   */
  private async doAuthentication(credential: PublicKeyCredential) {
    try {
      return await firstValueFrom(
        this.http.post(
          `/api/auth/authenticate`,
          {
            credential: {
              rawId: bufferToBase64(credential.rawId),
              response: {
                authenticatorData: bufferToBase64(
                  (credential.response as AuthenticatorAssertionResponse).authenticatorData,
                ),
                signature: bufferToBase64((credential.response as AuthenticatorAssertionResponse).signature),
                userHandle: bufferToBase64(
                  (credential.response as AuthenticatorAssertionResponse).userHandle as ArrayBuffer,
                ),
                clientDataJSON: bufferToBase64((credential.response as AuthenticatorAssertionResponse).clientDataJSON),
                id: credential.id,
                type: credential.type,
              },
            },
          },
          { withCredentials: true },
        ),
      );
    } catch (e) {
      console.error('authentication failed', e);
      return null;
    }
  }

  /**
   * Get credentials using the provided options
   * @param options The public key credential request options
   * @returns The retrieved public key credential or null if failed
   */
  private async getCredentials(options: PublicKeyCredentialRequestOptions): Promise<PublicKeyCredential | null> {
    const credentialId = (this.storage.get(CREDENTIALS_KEY) || '') as string;
    try {
      return (await navigator.credentials.get({
        publicKey: {
          ...options,
          challenge: new Uint8Array((options as any).challenge.data),
          allowCredentials: [
            {
              id: base64ToBuffer(credentialId),
              type: 'public-key',
              transports: ['internal'],
            },
          ],
        },
      })) as PublicKeyCredential;
    } catch (ex) {
      // Stored credentials not working for some reason.
      // Fallback to removing the registration to allow user
      // to re-register.
      console.error('failed to get credentials', ex);
      this.removeCredentials();
      return null;
    }
  }
}
