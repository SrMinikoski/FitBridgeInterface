import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CadastroTreino } from './cadastro-treino';

describe('CadastroTreino', () => {
  let component: CadastroTreino;
  let fixture: ComponentFixture<CadastroTreino>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CadastroTreino],
    }).compileComponents();

    fixture = TestBed.createComponent(CadastroTreino);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
