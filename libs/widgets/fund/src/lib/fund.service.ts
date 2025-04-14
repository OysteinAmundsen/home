import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AppSettingsService } from '@home/shared/app.settings';
import { cache } from '@home/shared/rxjs/cache';
import { objToString } from '@home/shared/utils/object';
import { map } from 'rxjs';

@Injectable()
export class FundService {
  private readonly http = inject(HttpClient);
  private readonly settings = inject(AppSettingsService);

  timeslots = [
    { label: '1', value: 'MONTH_1' },
    { label: '3', value: 'MONTH_3' },
    { label: '6', value: 'MONTH_6' },
    { label: '12', value: 'YEAR_1' },
  ];

  getFundData(instrumentIDs = this.settings.watchInstruments()) {
    return cache(
      () =>
        this.http
          .get<any>(`/api/fund/instrument_search/query/fundlist`, {
            params: {
              apply_filters: instrumentIDs.map((id) => `instrument_id=${id}`).join('|'),
            },
          })
          .pipe(map((res) => res.results)),
      objToString(instrumentIDs),
    );
  }

  getTimeSeries(identifier: string, timeslot = this.timeslots[1].value) {
    return cache(
      () =>
        this.http.get<any>(
          `/api/fund/market-data/price-time-series/v2/period/${timeslot}/identifier/${identifier}:FUND_NOK`,
        ),
      `${timeslot}_${identifier}`,
    );
  }

  searchFunds(query: string) {
    return this.http.get<any>(`/api/fund/main_search`, { params: { query } }).pipe(
      map((res) => {
        if (Array.isArray(res) && res.length > 0) {
          return (
            res
              .find((r) => r.display_group_type === 'FUND')
              ?.results.map((item: any) => ({
                id: item.instrument_id,
                name: item.display_name,
              })) ?? []
          );
        }
        return [];
      }),
    );
  }
}
