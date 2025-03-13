import { Component, inject, OnInit, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetComponent } from '@home/shared/widget/widget.component';
import { AbstractWidgetComponent } from '@home/shared/widget/abstract-widget.component';
import { FundService } from './fund.service';

@Component({
  selector: 'lib-fund',
  imports: [CommonModule, WidgetComponent],
  templateUrl: './fund.component.html',
  styleUrl: './fund.component.scss',
  providers: [{ provide: FundService }],
})
export default class FundComponent extends AbstractWidgetComponent implements OnInit {
  private readonly fundService = inject(FundService);

  override id = signal('fund');

  ngOnInit(): void {
    this.fundService.getFundData().subscribe((data) => {
      console.log(data);
    });
  }
}
