import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv({
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});

// Ensure the `matches` method is properly mocked
const originalMatches = Element.prototype.matches;
Object.defineProperty(Element.prototype, 'matches', {
  writable: true,
  value: function (selector: string) {
    if (selector === ':popover-open') {
      return this.hasAttribute('popover-open'); // Simulate the pseudo-class with an attribute
    }
    return originalMatches.call(this, selector);
  },
});

// Mock the `popover` attribute, falling back to the original if defined
if (!Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'popover')) {
  Object.defineProperty(HTMLElement.prototype, 'popover', {
    get() {
      return this.getAttribute('popover');
    },
    set(value: string) {
      this.setAttribute('popover', value);
    },
  });
}

// Mock the `popovertargetaction` attribute, falling back to the original if defined
if (!Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'popovertargetaction')) {
  Object.defineProperty(HTMLElement.prototype, 'popovertargetaction', {
    get() {
      return this.getAttribute('popovertargetaction');
    },
    set(value: string) {
      this.setAttribute('popovertargetaction', value);
    },
  });
}
