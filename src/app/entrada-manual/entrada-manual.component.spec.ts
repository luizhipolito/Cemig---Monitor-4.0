import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { EntradaManualComponent } from './entrada-manual.component';

describe('EntradaManualComponent', () => {
  let component: EntradaManualComponent;
  let fixture: ComponentFixture<EntradaManualComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EntradaManualComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(EntradaManualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
