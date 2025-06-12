import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  DOCUMENT,
  EnvironmentInjector,
  inject,
  Injectable,
} from '@angular/core';
import { SnackbarComponent } from './snackbar.component';

@Injectable({ providedIn: 'root' })
export class SnackbarService {
  private readonly appRef = inject(ApplicationRef);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(EnvironmentInjector);

  private snackbarComponentRef: ComponentRef<SnackbarComponent> | null = null;

  private getOrCreateSnackbarElement(): SnackbarComponent {
    if (!this.snackbarComponentRef) {
      // Create the snackbar component dynamically
      this.snackbarComponentRef = createComponent(SnackbarComponent, {
        environmentInjector: this.injector,
      });

      // Attach the component to the application
      this.appRef.attachView(this.snackbarComponentRef.hostView);

      // Append to the body (or app root) as the last child
      const hostElement = this.snackbarComponentRef.location.nativeElement;
      this.document.body.appendChild(hostElement);
    }

    return this.snackbarComponentRef.instance;
  }

  open(message: string, type: 'info' | 'warn' | 'error', options: { duration: number } = { duration: 3000 }): void {
    const snackbar = this.getOrCreateSnackbarElement();
    snackbar.show(message, type, options);
  }

  close(): void {
    if (this.snackbarComponentRef) {
      this.snackbarComponentRef.instance.close();
    }
  }

  destroy(): void {
    if (this.snackbarComponentRef) {
      this.appRef.detachView(this.snackbarComponentRef.hostView);
      this.snackbarComponentRef.destroy();
      this.snackbarComponentRef = null;
    }
  }
}
