import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { of } from 'rxjs';

@Injectable()
export class FundService {
  private readonly http = inject(HttpClient);

  getFundData() {
    return of([]);
    // return this.http.get<any>('/api/fund/instrument_search/query/fundlist');
  }
}
