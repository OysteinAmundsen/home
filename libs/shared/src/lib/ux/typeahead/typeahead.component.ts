import { CommonModule } from '@angular/common';
import { Component, ElementRef, forwardRef, input, OnInit, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';

let id = 0;

@Component({
  selector: 'lib-typeahead',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="form-group" [attr.popovertarget]="uniqueId()">
      <input type="text" [placeholder]="placeholder()" [formControl]="input" />
      <ng-content></ng-content>
    </div>
    <ul class="list" [id]="uniqueId()" popover="auto" #dropdown>
      @for (item of dropdownOptions(); track item) {
        @if (multiple()) {
          <li class="list-item">
            <label>
              <input
                type="checkbox"
                [checked]="selectedItems().includes(item)"
                (change)="toggleSelection(item, $event)"
              />
              {{ getDisplayValue(item) }}
            </label>
          </li>
        } @else {
          <li class="list-item" tabindex="0" (click)="selectItem(item)" (keydown.enter)="selectItem(item)">
            {{ getDisplayValue(item) }}
          </li>
        }
      }
    </ul>
  `,
  styles: `
    $xStart: -90deg;
    $yStart: 0;
    $zStart: 0;
    :host {
      .form-group {
        anchor-name: var(--anchor);
      }
      .list {
        position-anchor: var(--anchor);
        bottom: unset;
        top: calc(anchor(bottom) + 0.2rem);
        left: unset;
        right: anchor(right);
        transition:
          transform var(--animation-duration) ease-in-out,
          rotate var(--animation-duration) ease-in-out,
          opacity var(--animation-duration) ease-in-out,
          scale var(--animation-duration) ease-in-out,
          display var(--animation-duration) allow-discrete; // This enables close transition
        background-color: var(--color-background);
        transform-origin: top right;
        border-radius: var(--border-radius);
        border: 2px solid var(--color-border-focused);

        // Will animate back to these on close
        transform: rotateX($xStart) rotateY($yStart) rotateZ($zStart);
        scale: 0.2;
        opacity: 0.3;

        &:popover-open {
          transform: rotateX(0) rotateY(0) rotateZ(0);
          scale: 1;
          opacity: 1;

          border: 2px solid var(--color-border-focused);

          // Will animate from these on open
          @starting-style {
            transform: rotateX($xStart) rotateY($yStart) rotateZ($zStart);
            scale: 0.2;
            opacity: 0.3;
          }
        }
      }
    }
  `,
  host: {
    '[style.--anchor]': '"--" + uniqueId()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TypeaheadComponent),
      multi: true,
    },
  ],
})
export class TypeaheadComponent implements ControlValueAccessor, OnInit {
  multiple = input(false);
  // The search function to call when the input changes
  searchFn = input.required<(query: string) => Promise<any[]>>();
  // The function to display the item in the list
  displayValue = input<(item: any) => string>();
  placeholder = input<string>('');

  dropdown = viewChild<ElementRef<HTMLUListElement>>('dropdown');
  uniqueId = signal(`typeahead-${id++}`);

  // The input field
  input = new FormControl<string>('', { updateOn: 'change' });
  // The actual value this form control holds
  value = signal<any>({});
  // The selected item
  selectedItems = signal<any[]>([]);
  // The list of items to show in the dropdown
  dropdownOptions = signal<any[]>([]);

  private _setValueInternal(value: any) {
    // If the value is the same as the current value, do nothing
    if (value === this.value()) return;

    this.value.set(value);
    this.input.setValue(this.getDisplayValue(value), { emitEvent: false });
    this.selectedItems.set(Array.isArray(value) ? value : [value]);
    this._onChange(this.value());
  }

  ngOnInit(): void {
    // Search for items when the input changes
    this.input.valueChanges.pipe(debounceTime(300)).subscribe(async (value) => {
      this.dropdownOptions.set(value ? await this.searchFn()(value) : []);
      if (this.dropdownOptions().length > 0) {
        this.dropdown()?.nativeElement.showPopover();
      }
    });
  }

  // Triggered from multiple selection
  toggleSelection(item: any, event: Event) {
    this.selectedItems.update((items) => {
      if (items.includes(item)) {
        return items.filter((i) => i !== item);
      } else {
        return [...items, item];
      }
    });
  }

  // Triggered from single selection
  selectItem(item: any) {
    this._setValueInternal(item);
    this.dropdown()?.nativeElement.hidePopover();
    this.selectedItems.set([item]);
  }

  getDisplayValue(item: any) {
    if (this.displayValue()) {
      return this.displayValue()!(item);
    }
    return item;
  }

  // Callbacks to notify the form of changes
  _onChange = (value: any) => console.log('Value changed:', value);
  _onTouched = () => console.log('Input touched');

  // Called by the form to set the value
  writeValue(obj: any): void {
    this._setValueInternal(obj);
    this.selectedItems.set([obj]);
  }

  // Called by the form to register a change handler
  registerOnChange(fn: any): void {
    this._onChange = fn;
  }

  // Called by the form to register a touch handler
  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.input.disable();
    } else {
      this.input.enable();
    }
  }
}
