import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PyramidComponent } from './pyramid.component';

describe('PyramidComponent', () => {
  let component: PyramidComponent;
  let fixture: ComponentFixture<PyramidComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PyramidComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PyramidComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
