import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WidgetFundComponent } from './widget/fund/widget/fund.component';

describe('WidgetFundComponent', () => {
  let component: WidgetFundComponent;
  let fixture: ComponentFixture<WidgetFundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetFundComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WidgetFundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
