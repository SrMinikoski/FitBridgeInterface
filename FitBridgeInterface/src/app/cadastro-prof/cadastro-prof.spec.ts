import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CadastroProf } from './cadastro-prof';

describe('CadastroProf', () => {
  let component: CadastroProf;
  let fixture: ComponentFixture<CadastroProf>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CadastroProf],
    }).compileComponents();

    fixture = TestBed.createComponent(CadastroProf);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
