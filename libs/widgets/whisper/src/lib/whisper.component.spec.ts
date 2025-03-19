import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WidgetWhisperComponent } from './widgets/whisper/widgets/whisper.component';

describe('WidgetWhisperComponent', () => {
  let component: WidgetWhisperComponent;
  let fixture: ComponentFixture<WidgetWhisperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetWhisperComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WidgetWhisperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
