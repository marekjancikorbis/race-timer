import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SavedRoutesPage } from './saved-routes.page';

describe('SavedRoutesPage', () => {
  let component: SavedRoutesPage;
  let fixture: ComponentFixture<SavedRoutesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SavedRoutesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
