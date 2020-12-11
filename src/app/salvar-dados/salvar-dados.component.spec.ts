import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { SalvarDadosComponent } from './salvar-dados.component';

describe('SalvarDadosComponent', () => {
  let component: SalvarDadosComponent;
  let fixture: ComponentFixture<SalvarDadosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SalvarDadosComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(SalvarDadosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
