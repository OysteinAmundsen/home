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

  getTimeSeries(identifier: string) {
    return cache(
      () =>
        this.http.get<any>(
          `/api/fund/market-data/price-time-series/v2/period/MONTH_1/identifier/${identifier}:FUND_NOK`,
        ),
      identifier,
    );
  }
}
