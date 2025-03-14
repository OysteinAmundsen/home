import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WidgetsSpaceInvadersComponent } from './widgets/space-invaders/widgets/space-invaders.component';

describe('WidgetsSpaceInvadersComponent', () => {
  let component: WidgetsSpaceInvadersComponent;
  let fixture: ComponentFixture<WidgetsSpaceInvadersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetsSpaceInvadersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WidgetsSpaceInvadersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
