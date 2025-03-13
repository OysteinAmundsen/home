import { ComponentFixture, TestBed } from '@angular/core/testing';
import StarFieldComponent from './starfield.component';

describe('StarfieldComponent', () => {
  let component: StarFieldComponent;
  let fixture: ComponentFixture<StarFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StarFieldComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StarFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
