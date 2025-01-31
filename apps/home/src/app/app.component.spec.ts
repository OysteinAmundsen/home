import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { AuthenticationService } from './shared/auth/authentication.service';
import { WidgetService } from './shared/widget/widget.service';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;

  const widgetStub = {
    filter: signal<number | undefined>(undefined),
    widgets: { error: jest.fn() },
    loadWidget: jest.fn(),
  };

  const authStub = {
    isRegistered: signal(false),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([]), AppComponent],
      providers: [
        { provide: WidgetService, useValue: widgetStub },
        { provide: AuthenticationService, useValue: authStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });
});
