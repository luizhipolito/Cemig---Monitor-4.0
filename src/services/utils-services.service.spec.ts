import { TestBed } from '@angular/core/testing';

import { UtilsServicesService } from './utils-services.service';

describe('UtilsServicesService', () => {
  let service: UtilsServicesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UtilsServicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
