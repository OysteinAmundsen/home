import { Controller, Get, Query } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { GeocoderResult } from './location.model';

/**
 * The controller for the /api/location route.
 *
 * @param server
 */
@Controller('api/location')
export class LocationController {
  apiKey?: string;

  constructor() {
    dotenv.config({ path: '.env' });
    this.apiKey = process.env.GOOGLE_API_KEY;
  }

  @Get('search')
  async search(@Query() search: string): Promise<GeocoderResult[]> {
    const endpoint = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    endpoint.searchParams.append('address', search);
    endpoint.searchParams.append('key', this.apiKey!);
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    if (data.status === 'OK') {
      return data.results.map((result: any) => ({
        address: result.formatted_address,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      }));
    } else {
      throw new Error(`Geocoding API Error: ${data.status} - ${data.error_message || ''}`);
    }
  }
}
