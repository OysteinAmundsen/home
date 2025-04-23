import { A } from '@angular/core/weak_ref.d-DOjz-6fK';
import { GeoLocationItem } from '@home/shared/browser/geo-location/location.model';
import { Controller, Get, Logger, NotFoundException, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import * as dotenv from 'dotenv';

/**
 * The controller for the /api/location route.
 *
 * @param server
 */
@ApiTags('location')
@Controller('api/location')
export class LocationController {
  apiKey?: string;

  constructor() {
    dotenv.config({ path: '.env' });
    this.apiKey = process.env.GOOGLE_API_KEY;
  }

  @Get('search')
  @ApiOperation({ summary: 'Search for a location' })
  @ApiOkResponse({ description: 'An array of locations.' })
  async search(@Query('s') search: string): Promise<GeoLocationItem[]> {
    const endpoint = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    endpoint.searchParams.append('address', search);
    endpoint.searchParams.append('key', this.apiKey!);
    Logger.log(endpoint.toString(), 'GET');
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    if (data.status === 'OK') {
      return data.results.map(
        (result: any) =>
          ({
            address: result.formatted_address,
            city: result.address_components.filter((c: any) => c.types.includes('locality'))?.[0]?.long_name ?? null,
            area:
              result.address_components.filter((c: any) => c.types.includes('administrative_area_level_1'))?.[0]
                ?.long_name ?? null,
            postal_code:
              result.address_components.filter((c: any) => c.types.includes('postal_code'))?.[0]?.long_name ?? null,
            country: result.address_components.filter((c: any) => c.types.includes('country'))?.[0]?.long_name ?? null,
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng,
          }) as GeoLocationItem,
      );
    } else {
      throw new NotFoundException(`Geocoding API Error: ${data.status} - ${data.error_message || ''}`);
    }
  }
}
