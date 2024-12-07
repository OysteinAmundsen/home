import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  inject,
  Injector,
  input,
  PLATFORM_ID,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { Widget } from './widget.service';

@Component({
  selector: 'app-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss'],
})
export class WidgetComponent implements AfterViewInit {
  private readonly injector = inject(Injector);
  private readonly platform = inject(PLATFORM_ID);
  data = input<Widget>();
  container = viewChild('container', { read: ViewContainerRef });

  /**
   * Dynamically load a component based on the `componentName` input.
   *
   * @returns a reference to the component class
   */
  async loadComponent() {
    let component: any;
    switch (this.data()?.componentName) {
      case 'widget1':
        const { Widget1Component } = await import(
          '../../views/widget1.component'
        );
        component = Widget1Component;
        break;
      case 'widget2':
        const { Widget2Component } = await import(
          '../../views/widget2.component'
        );
        component = Widget2Component;
        break;
    }
    return component;
  }

  ngAfterViewInit(): void {
    this.container()?.clear();
    if (isPlatformBrowser(this.platform)) {
      // This has to run client side only because of SSR
      // The server dies violently when we try to create a component dynamically.
      // It yields a `NG0205: Injector has already been destroyed.` error.

      // But this is a poor solution because it creates a layout shift
      // between the server rendered content and the client rendered content.
      this.loadComponent().then((component) => {
        try {
          const componentRef = this.container()?.createComponent(component);
          componentRef?.setInput('data', this.data());
        } catch (error) {
          console.error('Error creating component:', error);
        }
      });
    }
  }
}
