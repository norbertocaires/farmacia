import { Injectable, signal } from '@angular/core';

export type Theme = 'dark' | 'light' | 'original';

const STORAGE_KEY = 'theme';
const CYCLE: Theme[] = ['dark', 'light', 'original'];
const VALID: readonly Theme[] = CYCLE;

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSignal = signal<Theme>(this.getInitialTheme());

  theme = this.themeSignal.asReadonly();
  isLight = () => this.themeSignal() === 'light';
  isDark = () => this.themeSignal() === 'dark';
  isOriginal = () => this.themeSignal() === 'original';

  private static readonly ICON: Record<Theme, string> = {
    dark: 'fa-moon',
    light: 'fa-sun',
    original: 'fa-clock-rotate-left',
  };

  private static readonly LABEL: Record<Theme, string> = {
    dark: 'Tema escuro',
    light: 'Tema claro',
    original: 'Tema original',
  };

  /** Ícone/rótulo do PRÓXIMO tema do ciclo — o botão mostra pra onde ele leva. */
  nextThemeIcon = () => ThemeService.ICON[this.nextTheme()];
  nextThemeLabel = () => ThemeService.LABEL[this.nextTheme()];

  private nextTheme(): Theme {
    return CYCLE[(CYCLE.indexOf(this.themeSignal()) + 1) % CYCLE.length];
  }

  constructor() {
    this.apply(this.themeSignal());
  }

  /** Avança pro próximo tema do ciclo: dark → light → original → dark. */
  toggle(): void {
    this.set(this.nextTheme());
  }

  set(theme: Theme): void {
    this.themeSignal.set(theme);
    localStorage.setItem(STORAGE_KEY, theme);
    this.apply(theme);
  }

  private apply(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }

  private getInitialTheme(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (VALID as string[]).includes(stored ?? '') ? (stored as Theme) : 'dark';
  }
}
