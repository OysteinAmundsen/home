import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'icon',
  pure: true,
})
export class IconPipe implements PipeTransform {
  sec = inject(DomSanitizer);

  transform(value: any, ...args: any[]): any {
    return this.sec.bypassSecurityTrustHtml(
      `<span class="material-symbols-outlined">${this.translate(value)}</span>`,
    );
  }

  private translate(value: string): string {
    switch (value) {
      case 'cloudy':
        return 'cloud';
      case 'lightrain':
      case 'rainshowers_day':
        return 'rainy_light';
      case 'rain':
        return 'rainy';
      case 'heavyrain':
        return 'rainy_heavy';
      case 'partlycloudy_night':
        return 'partly_cloudy_night';
      case 'snow':
      case 'lightsnow':
        return 'weather_snowy';
      case 'lightsnowshowers_day':
      case 'lightsnowshowers_night':
        return 'weather_snowy';
      case 'snowshowers_day':
        return 'sunny_snowing';
      case 'snowshowers_night':
        return 'cloudy_snowing';
    }
    return value;
  }
}
