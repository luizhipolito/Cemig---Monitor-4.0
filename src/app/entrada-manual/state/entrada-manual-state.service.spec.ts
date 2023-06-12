import { TestBed } from '@angular/core/testing';

import { EntradaManualStateService } from './entrada-manual-state.service';

describe('EntradaManualStateService', () => {
  let service: EntradaManualStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EntradaManualStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
