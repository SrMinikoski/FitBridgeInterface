import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CadastroExercicio } from './cadastro-exercicio';

describe('CadastroExercicio', () => {
  let component: CadastroExercicio;
  let fixture: ComponentFixture<CadastroExercicio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CadastroExercicio],
    }).compileComponents();

    fixture = TestBed.createComponent(CadastroExercicio);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
