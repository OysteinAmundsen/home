import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WidgetService } from '@home/shared/widget/widget.service';
import { default as WeatherComponent } from './weather.component';

describe('WeatherComponent', () => {
  let component: WeatherComponent;
  let fixture: ComponentFixture<WeatherComponent>;

  const widgetServiceMock = {
    getRoute: () => ({ path: 'starfield', data: { widget: true } }),
    isDescendantOfDashboard: () => false,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideLocationMocks(),
        { provide: WidgetService, useValue: widgetServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
