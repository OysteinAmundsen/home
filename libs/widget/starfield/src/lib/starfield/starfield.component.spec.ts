import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ResizeObserverMock } from '@home/shared/testing/resize-observer-mock';
import { WidgetService } from '@home/shared/widget/widget.service';
import StarFieldComponent from './starfield.component';

window.ResizeObserver = ResizeObserverMock as any;

describe('StarfieldComponent', () => {
  let component: StarFieldComponent;
  let fixture: ComponentFixture<StarFieldComponent>;

  const widgetServiceMock = {
    getRoute: () => ({ path: 'starfield', data: { widget: true } }),
    isDescendantOfDashboard: () => false,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StarFieldComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideLocationMocks(),
        { provide: WidgetService, useValue: widgetServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StarFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
