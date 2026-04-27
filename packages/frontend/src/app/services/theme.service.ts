import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ThemeName = 'dark' | 'light';

interface ThemeConfig {
  name: ThemeName;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly themeKey = 'rail-service.theme';
  private currentThemeSubject: BehaviorSubject<ThemeName>;
  currentTheme$: Observable<ThemeName>;

  private themes: Record<ThemeName, ThemeConfig> = {
    dark: {
      name: 'dark',
      primaryColor: '#7bc7ff',
      accentColor: '#ff7c2d',
      backgroundColor: '#070a12',
      surfaceColor: '#131a27',
      textPrimary: '#f6f7fb',
      textSecondary: '#a6afc7',
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    light: {
      name: 'light',
      primaryColor: '#1e88e5',
      accentColor: '#ff6f00',
      backgroundColor: '#ffffff',
      surfaceColor: '#f5f5f5',
      textPrimary: '#212121',
      textSecondary: '#666666',
      borderColor: 'rgba(0, 0, 0, 0.12)',
    },
  };

  constructor() {
    const savedTheme = this.loadSavedTheme();
    this.currentThemeSubject = new BehaviorSubject<ThemeName>(savedTheme);
    this.currentTheme$ = this.currentThemeSubject.asObservable();
    this.applyTheme(savedTheme);
  }

  setTheme(themeName: ThemeName): void {
    this.currentThemeSubject.next(themeName);
    this.applyTheme(themeName);
    this.saveTheme(themeName);
  }

  getCurrentTheme(): ThemeName {
    return this.currentThemeSubject.value;
  }

  getThemeConfig(themeName?: ThemeName): ThemeConfig {
    const theme = themeName || this.getCurrentTheme();
    return this.themes[theme];
  }

  private applyTheme(themeName: ThemeName): void {
    const config = this.themes[themeName];
    const root = document.documentElement;

    root.style.setProperty('--primary-color', config.primaryColor);
    root.style.setProperty('--accent-color', config.accentColor);
    root.style.setProperty('--bg-color', config.backgroundColor);
    root.style.setProperty('--surface-color', config.surfaceColor);
    root.style.setProperty('--text-primary', config.textPrimary);
    root.style.setProperty('--text-secondary', config.textSecondary);
    root.style.setProperty('--border-color', config.borderColor);

    // Aggiungi classe al body per CSS specifici
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(`theme-${themeName}`);
  }

  private saveTheme(themeName: ThemeName): void {
    try {
      localStorage.setItem(this.themeKey, themeName);
    } catch {
      // Ignore localStorage error
    }
  }

  private loadSavedTheme(): ThemeName {
    try {
      const saved = localStorage.getItem(this.themeKey);
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {
      // Ignore localStorage error
    }
    // Default to dark theme
    return 'dark';
  }
}
