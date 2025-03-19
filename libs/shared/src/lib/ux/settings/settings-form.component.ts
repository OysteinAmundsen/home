import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { AppSettingsService } from '../../app.settings';
import { StringPipe } from '../../pipes/string.pipe';

type AppSettingType = 'text' | 'number' | 'checkbox';
type AppSettingValueType = string | number | boolean;
type AppSetting = {
  name: string;
  type: AppSettingType;
  value: AppSettingValueType;
};

@Component({
  selector: 'lib-settings-form',
  imports: [CommonModule, ReactiveFormsModule, StringPipe],
  templateUrl: './settings-form.component.html',
  styleUrl: './settings-form.component.scss',
})
export class SettingsFormComponent implements OnInit {
  settings = inject(AppSettingsService);
  fb = inject(FormBuilder);
  destroyRef$ = inject(DestroyRef);

  props = Object.entries(this.settings).reduce((acc, [key, value]) => {
    if (typeof value === 'function') value = value();
    let type = typeof value as AppSettingType;
    // prettier-ignore
    switch (typeof value) {
      case 'string':  type = 'text'; break;
      case 'number':  type = 'number'; break;
      case 'boolean': type = 'checkbox'; break;
    }
    if (Array.isArray(value)) {
      type = 'text';
      value = value.join(', ');
    }
    acc.push({ name: key, type, value });
    return acc;
  }, [] as AppSetting[]);

  // Create a form group with a form control for each setting
  form = this.fb.group(
    this.props.reduce(
      (acc, prop) => {
        acc[prop.name] = new FormControl(prop.value);
        return acc;
      },
      {} as Record<string, FormControl>,
    ),
    { updateOn: 'change' },
  );

  ngOnInit(): void {
    // Update the settings service with the new values
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe((values) => {
      // eslint-disable-next-line prefer-const
      for (let [key, value] of Object.entries(values)) {
        let originalValue = value;
        if (typeof (this.settings as any)[key] === 'function') {
          originalValue = (this.settings as any)[key]();
        }
        if (typeof originalValue === 'object' && Array.isArray(originalValue)) {
          value = value.split(',').map((v: string) => v.trim());
        }
        (this.settings as any)[key].set(value);
      }
    });
  }

  getControl(name: string) {
    return this.form.get(name) as FormControl;
  }
}
