import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  computed,
  inject,
  Injectable,
  linkedSignal,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';

const bufferToBase64 = (buffer: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)));
const base64ToBuffer = (base64: string) =>
  Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
const CREDENTIALS_KEY = 'credentials';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  /** The credential raw id stored in localStorage */
  credentials = linkedSignal(() =>
    isPlatformBrowser(this.platformId)
      ? localStorage.getItem(CREDENTIALS_KEY)
      : '',
  );

  /** Returns true if there exists credentials in localStorage */
  isRegistered = computed(() => !!this.credentials());

  /** Returns true if user is currently logged in */
  isLoggedIn = signal(false);

  private setCredentials(rawId: string) {
    localStorage.setItem(CREDENTIALS_KEY, rawId);
    this.credentials.set(rawId);
  }

  /**
   * Register a new user to the system
   *
   * @param userName The username to register
   */
  async register(userName: string, displayName: string) {
    // Get the registration options from the server
    const options = await firstValueFrom(
      this.http.get<any>(`/api/auth/registration-options`),
    );

    // Create the webauth credentials
    const credential = (await navigator.credentials.create({
      publicKey: {
        ...options,
        challenge: new Uint8Array(options.challenge.data),
        user: {
          id: new Uint8Array(options.user.id.data),
          name: userName,
          displayName: displayName,
        },
      },
    })) as Credential;

    // Somehow the `rawId` property is not part of the `Credential` interface
    // but it is there when I log the credential object
    const rawId = bufferToBase64((credential as any).rawId);

    // Send the credential to the server
    try {
      await firstValueFrom(
        this.http.post(
          `/api/auth/register`,
          {
            credential: {
              rawId,
              response: {
                attestationObject: bufferToBase64(
                  (credential as any).response.attestationObject,
                ),
                clientDataJSON: bufferToBase64(
                  (credential as any).response.clientDataJSON,
                ),
                id: (credential as any).id,
                type: (credential as any).type,
              },
            },
          },
          { withCredentials: true },
        ),
      );

      // Store the credential id in localStorage
      this.setCredentials(rawId);
    } catch (e) {
      console.error('registration failed', e);
    }
  }

  /**
   * Remove the registration from the system
   *
   * NOTE: Webauthn does not currently support removing credentials, so we just
   * remove the credential from the local storage. Beware that registerring and
   * removing credentials a lot of times will fill up your passkey storage.
   */
  removeRegistration() {
    localStorage.removeItem(CREDENTIALS_KEY);
    this.credentials.set('');
  }

  /**
   * Authenticate the user
   */
  async authenticate() {
    // Get the authentication options from the server
    const options = await firstValueFrom(
      this.http.get<PublicKeyCredentialRequestOptions>(
        `/api/auth/authentication-options`,
      ),
    );

    // Create the webauth credentials
    const credential = await this.getCredentials(options);

    // Do the actual authentication
    if (credential) {
      this.doAuthentication(credential);
    }
  }

  private async getCredentials(
    options: PublicKeyCredentialRequestOptions,
  ): Promise<Credential | null> {
    const credentialId = localStorage.getItem(CREDENTIALS_KEY) || '';
    try {
      return await navigator.credentials.get({
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
      });
    } catch (ex) {
      // Stored credentials not working for some reason.
      // Fallback to removing the registration to allow user
      // to re-register.
      console.error('failed to get credentials', ex);
      this.removeRegistration();
      return null;
    }
  }

  private async doAuthentication(credential: Credential) {
    try {
      return await firstValueFrom(
        this.http.post(
          `/api/auth/authenticate`,
          {
            credential: {
              rawId: bufferToBase64((credential as any).rawId),
              response: {
                authenticatorData: bufferToBase64(
                  (credential as any).response.authenticatorData,
                ),
                signature: bufferToBase64(
                  (credential as any).response.signature,
                ),
                userHandle: bufferToBase64(
                  (credential as any).response.userHandle,
                ),
                clientDataJSON: bufferToBase64(
                  (credential as any).response.clientDataJSON,
                ),
                id: (credential as any).id,
                type: (credential as any).type,
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
}
