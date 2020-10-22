import { TestBed } from '@angular/core/testing';

import { StorageArvoreService } from './storage-arvore.service';

describe('StorageArvoreService', () => {
  let service: StorageArvoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageArvoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
