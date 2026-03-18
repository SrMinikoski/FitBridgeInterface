import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Workoutpage } from './workoutpage';

describe('Workoutpage', () => {
  let component: Workoutpage;
  let fixture: ComponentFixture<Workoutpage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Workoutpage],
    }).compileComponents();

    fixture = TestBed.createComponent(Workoutpage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
