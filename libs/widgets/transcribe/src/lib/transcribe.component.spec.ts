import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WidgetService } from '@home/shared/widget/widget.service';
import { default as TranscribeComponent } from './transcribe.component';

describe('TranscribeComponent', () => {
  let component: TranscribeComponent;
  let fixture: ComponentFixture<TranscribeComponent>;

  const widgetServiceMock = {
    getRoute: () => ({ path: 'starfield', data: { widget: true } }),
    isDescendantOfDashboard: () => false,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranscribeComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideLocationMocks(),
        { provide: WidgetService, useValue: widgetServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TranscribeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
