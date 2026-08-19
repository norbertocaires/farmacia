import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { NavbarLogout } from './navbar-logout';

describe('NavbarLogout', () => {
  let component: NavbarLogout;
  let fixture: ComponentFixture<NavbarLogout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarLogout],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarLogout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
