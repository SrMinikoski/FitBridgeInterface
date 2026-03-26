import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaExercicios } from './lista-exercicios';

describe('ListaExercicios', () => {
  let component: ListaExercicios;
  let fixture: ComponentFixture<ListaExercicios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaExercicios],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaExercicios);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
