import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  ElementRef,
  inject,
  linkedSignal,
  Signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { map, merge } from 'rxjs';
import { titleCase } from '../utils/string';
import { doSafeTransition } from '../utils/transitions';
import { AuthenticationService } from './authentication.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (!isRegistered()) {
      <button type="button" class="primary" (click)="openDialog()">
        Register
      </button>
    } @else if (!isLoggedIn()) {
      <button type="button" class="primary" (click)="doLogin()">Login</button>
    } @else {
      <button type="button" class="warn" (click)="removeUser()">
        Remove user
      </button>
    }

    <dialog
      #dialog
      (click)="closeDialog()"
      (close)="onClose()"
      (keydown)="keydown($event)"
      tabindex="0"
    >
      <form
        [formGroup]="form"
        (submit)="doRegister()"
        (click)="$event.stopPropagation()"
        (keydown)="keydown($event)"
      >
        <header><h2>Register user</h2></header>

        <div class="form-field">
          <input
            #emailInput
            type="email"
            formControlName="email"
            placeholder="Email"
            autocomplete="email"
            (blur)="emailBlur()"
            [class.ng-invalid]="
              showValidationErrors() && form.get('email')?.invalid
            "
          />
          <small class="hint">
            @if (showValidationErrors() && form.dirty) {
              @if (form.get('email')?.hasError('required')) {
                Must provide an email
              } @else if (form.get('email')?.hasError('email')) {
                Must provide a valid address
              } @else if (form.get('email')?.hasError('minlength')) {
                Must provide a valid address
              }
            }
          </small>
        </div>
        <div class="form-field">
          <input
            type="text"
            formControlName="displayName"
            [attr.placeholder]="displayName()"
          />
        </div>
        <footer>
          <button type="submit" [disabled]="isInvalid()">Register</button>
          <button type="button" class="flat" (click)="closeDialog()">
            Cancel
          </button>
        </footer>
      </form>
    </dialog>
  `,
  styles: `
    dialog {
      header {
        margin-bottom: 1.5rem;
      }
      footer {
        margin-top: 1.5rem;
        display: flex;
        place-content: space-between;
      }
    }
  `,
})
export class LoginComponent {
  private auth = inject(AuthenticationService);
  private fb = inject(FormBuilder);

  private dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  private emailInput = viewChild<ElementRef<HTMLInputElement>>('emailInput');

  isRegistered = this.auth.isRegistered;
  isLoggedIn = this.auth.isLoggedIn;

  /** The registration form to fill out */
  form = this.fb.group(
    {
      email: [
        null,
        [Validators.required, Validators.email, Validators.minLength(6)],
      ],
      displayName: [null, []],
    },
    { updateOn: 'change' },
  );

  /** Makes compute signals below work */
  onFormChanged = toSignal(
    merge(this.form.valueChanges, this.form.statusChanges).pipe(
      map(() => ({ form: this.form, value: this.form.getRawValue() })),
    ),
  );

  /** Only show validation errors after email field receives first blur event */
  showValidationErrors = linkedSignal(() => this.form.dirty);

  /** Returns true if the current form data is valid */
  isInvalid = computed(() => {
    const change = this.onFormChanged();
    if (!change) return true;
    return change?.form.invalid && change?.form.dirty;
  });

  /** Make sure the form data always returns a value */
  userData = computed(
    () =>
      this.onFormChanged()?.value ?? {
        email: '',
        displayName: '',
      },
  ) as Signal<{ email: string; displayName: string }>;

  displayName = computed(() => {
    const change = this.onFormChanged();
    return (
      titleCase(
        (change?.value.email ?? '').split('@')[0].replace('.', ' '),
      ).replace(' ', '') || 'Display name'
    );
  });

  /** Open the dialog and focus the email field */
  openDialog() {
    // Open the dialog. CSS takes care of the enter animations
    this.dialog()?.nativeElement.showModal();
    // Focus the email input after animation is complete
    setTimeout(() => this.emailInput()?.nativeElement.focus(), 300);
  }

  /** Close the dialog */
  closeDialog() {
    // Close the dialog. View transitions takes care of the exit animations
    doSafeTransition(() => this.dialog()?.nativeElement.close());
  }

  /** When the dialog is closing, reset the form */
  onClose() {
    this.form.reset();
  }

  /** In order to animate close events on the dialog, we have to override the default behaviour */
  keydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeDialog();
    }
  }

  /** Start the registration process */
  doRegister() {
    // Close the dialog
    this.closeDialog();
    // Register the user
    const user = this.userData();
    this.auth.register(user.email, user.displayName || this.displayName());
  }

  /** Login using stored credentials */
  doLogin() {
    this.auth.authenticate();
  }

  /** Remove stored credentials */
  removeUser() {
    this.auth.removeCredentials();
  }

  emailBlur() {
    this.showValidationErrors.set(true);
  }
}
