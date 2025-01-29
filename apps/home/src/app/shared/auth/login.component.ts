import { Component, inject } from '@angular/core';
import { AuthenticationService } from './authentication.service';

@Component({
  selector: 'app-login',
  template: `
    <button (click)="login()">Login</button>
    <button (click)="removeUser()">Remove user</button>
  `,
  styles: ``,
})
export class LoginComponent {
  private auth = inject(AuthenticationService);

  login() {
    this.auth.authenticate();
  }

  removeUser() {
    this.auth.removeRegistration();
  }
}
