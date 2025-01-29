import { Component, inject } from '@angular/core';
import { AuthenticationService } from './authentication.service';

@Component({
  selector: 'app-register',
  template: `<button (click)="register()">Register</button>`,
  styles: ``,
})
export class RegisterComponent {
  private auth = inject(AuthenticationService);

  register() {
    this.auth.register('username');
  }
}
