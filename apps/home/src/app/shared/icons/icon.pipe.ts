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
  // prettier-ignore
  private readonly synonyms = {
    bedtime: ['clearsky_night', 'fair_night'],
    clear_day: ['clearsky_day', 'fair_day'],
    cloud: ['cloudy'],
    cloudy_snowing: ['snowshowers_night'],
    foggy: ['fog'],
    partly_cloudy_day: ['partlycloudy_day'],
    partly_cloudy_night: ['partlycloudy_night'],
    rainy_heavy: ['heavyrain'],
    rainy_light: ['lightrain', 'rainshowers_day'],
    rainy_snow: ['sleet','lightsleet','lightsleetshowers_day','lightsleetshowers_night'],
    rainy: ['rain'],
    sunny_snowing: ['snowshowers_day'],
    weather_snowy: ['snow','lightsnow','lightsnowshowers_day','lightsnowshowers_night'],
  };

  transform(value: any, ...args: any[]): any {
    // Lookup the given value in the synonyms list and return the synonym key if it exists
    // Otherwise return the original value
    const translated = Object.entries(this.synonyms).reduce((acc, [key, values]) => {
      return values.includes(value) ? key : acc;
    }, value);
    // Render the translated value as a material icon
    return this.sec.bypassSecurityTrustHtml(`<span class="material-symbols-outlined">${translated}</span>`);
  }
}
