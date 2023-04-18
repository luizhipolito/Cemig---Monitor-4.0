import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { LogsLeituraComponent } from './logs-leitura.component';

describe('LogsLeituraComponent', () => {
  let component: LogsLeituraComponent;
  let fixture: ComponentFixture<LogsLeituraComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LogsLeituraComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(LogsLeituraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
