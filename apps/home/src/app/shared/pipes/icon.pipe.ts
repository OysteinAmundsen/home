import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'icon',
  pure: true,
})
export class IconPipe implements PipeTransform {
  private readonly sec = inject(DomSanitizer);

  // Translates weather symbols into material icons
  // Format is `icon: [weather symbols]`
  private readonly synonyms = {
    cloud: ['cloudy'],
    rainy_light: ['lightrain', 'rainshowers_day'],
    rainy: ['rain'],
    rainy_heavy: ['heavyrain'],
    partly_cloudy_night: ['partlycloudy_night'],
    partly_cloudy_day: ['partlycloudy_day'],
    weather_snowy: [
      'snow',
      'lightsnow',
      'lightsnowshowers_day',
      'lightsnowshowers_night',
    ],
    sunny_snowing: ['snowshowers_day'],
    cloudy_snowing: ['snowshowers_night'],
    clear_day: ['clearsky_day'],
    bedtime: ['clearsky_night', 'fair_night'],
  };

  transform(value: any, ...args: any[]): any {
    // Lookup the given value in the synonyms list and return the synonym key if it exists
    // Otherwise return the original value
    const translated = Object.entries(this.synonyms).reduce(
      (acc, [key, values]) => {
        return values.includes(value) ? key : acc;
      },
      value,
    );
    // Render the translated value as a material icon
    return this.sec.bypassSecurityTrustHtml(
      `<span class="material-symbols-outlined">${translated}</span>`,
    );
  }
}
