import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CadstroUser } from './cadstro-user';

describe('CadstroUser', () => {
  let component: CadstroUser;
  let fixture: ComponentFixture<CadstroUser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CadstroUser],
    }).compileComponents();

    fixture = TestBed.createComponent(CadstroUser);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
