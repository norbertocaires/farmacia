import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('should default to dark when nothing is stored', () => {
    const service = TestBed.configureTestingModule({}).inject(ThemeService);

    expect(service.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should cycle dark -> light -> original -> dark', () => {
    const service = TestBed.configureTestingModule({}).inject(ThemeService);

    service.toggle();
    expect(service.theme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    service.toggle();
    expect(service.theme()).toBe('original');

    service.toggle();
    expect(service.theme()).toBe('dark');
  });

  it('should persist the chosen theme to localStorage', () => {
    const service = TestBed.configureTestingModule({}).inject(ThemeService);

    service.set('original');

    expect(localStorage.getItem('theme')).toBe('original');
  });

  it('should restore a valid stored theme on init', () => {
    localStorage.setItem('theme', 'light');

    const service = TestBed.configureTestingModule({}).inject(ThemeService);

    expect(service.theme()).toBe('light');
  });

  it('should fall back to dark when the stored value is not a valid theme', () => {
    localStorage.setItem('theme', 'blue');

    const service = TestBed.configureTestingModule({}).inject(ThemeService);

    expect(service.theme()).toBe('dark');
  });

  it('should expose the icon/label of the next theme in the cycle', () => {
    const service = TestBed.configureTestingModule({}).inject(ThemeService);

    expect(service.nextThemeLabel()).toBe('Tema claro');
    service.toggle();
    expect(service.nextThemeLabel()).toBe('Tema original');
    service.toggle();
    expect(service.nextThemeLabel()).toBe('Tema escuro');
  });
});
