import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapRoutePage } from './map-route.page';

describe('MapRoutePage', () => {
  let component: MapRoutePage;
  let fixture: ComponentFixture<MapRoutePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MapRoutePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
