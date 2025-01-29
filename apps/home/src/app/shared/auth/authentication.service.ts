import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  computed,
  inject,
  Injectable,
  linkedSignal,
  PLATFORM_ID,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';

const bufferToBase64 = (buffer: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)));
const base64ToBuffer = (base64: string) =>
  Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  credentials = linkedSignal(() =>
    isPlatformBrowser(this.platformId)
      ? localStorage.getItem('credentials')
      : '',
  );
  isRegistered = computed(() => !!this.credentials());

  private setCredentials(rawId: string) {
    localStorage.setItem('credentials', JSON.stringify(rawId));
    this.credentials.set(rawId);
  }

  /**
   * Register a new user to the system
   *
   * @param userName The username to register
   */
  async register(userName: string) {
    // Get the registration options from the server
    const options = await firstValueFrom(
      this.http.get<any>('/api/auth/registration-options'),
    );

    // Create the webauth credentials
    const credential = (await navigator.credentials.create({
      publicKey: {
        ...options,
        challenge: new Uint8Array(options.challenge.data),
        user: {
          id: new Uint8Array(options.user.id.data),
          name: userName,
          displayName: userName,
        },
      },
    })) as Credential;

    // Somehow the `rawId` property is not part of the `Credential` interface
    // but it is there when I log the credential object
    const rawId = bufferToBase64((credential as any).rawId);

    // Send the credential to the server
    await this.http.post('/api/auth/register', { credential: { rawId } });

    // Store the credential id in localStorage
    this.setCredentials(rawId);
  }

  /**
   * Remove the registration from the system
   */
  removeRegistration() {
    localStorage.removeItem('credentials');
    this.credentials.set('');
  }

  /**
   * Authenticate the user
   */
  async authenticate() {
    // Get the authentication options from the server
    const options = await firstValueFrom(
      this.http.get<any>('/api/auth/authentication-options'),
    );
    // Create the webauth credentials
    const credential = (await navigator.credentials.get({
      publicKey: {
        ...options,
        challenge: new Uint8Array(options.challenge.data),
      },
    })) as Credential;

    // Send the credential to the server
    // await this.http.post('/api/auth/authenticate', {
    //   credential: {
    //     rawId: bufferToBase64(credential.rawId),
    //     response: {
    //       authenticatorData: bufferToBase64(
    //         (credential.response as AuthenticatorResponse).authenticatorData,
    //       ),
    //       clientDataJSON: bufferToBase64(
    //         (credential.response as AuthenticatorResponse).clientDataJSON,
    //       ),
    //       signature: bufferToBase64(
    //         (credential.response as AuthenticatorResponse).signature,
    //       ),
    //     },
    //   },
    // });
  }
}
