import { TestBed } from '@angular/core/testing';

import { RouteStorage } from './route-storage';

describe('RouteStorage', () => {
  let service: RouteStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RouteStorage);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
