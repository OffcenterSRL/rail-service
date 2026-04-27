# Sistema di Tematizzazione

Il progetto Rail Service implementa un sistema di tematizzazione completo con supporto per tema scuro e tema chiaro.

## Funzionalità

- **Tema Scuro** (default): Design moderno con colori blu/arancio su sfondo scuro
- **Tema Chiaro**: Interfaccia luminosa con colori Material Design 3
- **Persistenza**: Il tema selezionato viene salvato in localStorage
- **Transizioni fluide**: Cambio tema con transizioni CSS smooth di 300ms
- **Toggle rapido**: Pulsante nel dropdown del profilo per alternare i temi

## Variabili CSS

### Colori primari
```css
--primary-color     /* Colore primario (blu scuro/light) */
--accent-color      /* Colore di accento (arancio) */
--bg-color          /* Colore di sfondo principale */
--surface-color     /* Colore di surface secondario */
--text-primary      /* Colore testo primario */
--text-secondary    /* Colore testo secondario */
--border-color      /* Colore bordi */
```

### Tema Scuro
- Primary: `#7bc7ff` (Blu chiaro)
- Accent: `#ff7c2d` (Arancio)
- Background: `#070a12` (Nero profondo)
- Text Primary: `#f6f7fb` (Bianco)

### Tema Chiaro
- Primary: `#1e88e5` (Blu Material Design)
- Accent: `#ff6f00` (Arancio Material Design)
- Background: `#ffffff` (Bianco)
- Text Primary: `#212121` (Nero)

## Uso

### Cambio tema programmatico
```typescript
import { ThemeService } from './services/theme.service';

constructor(private themeService: ThemeService) {}

setLightTheme() {
  this.themeService.setTheme('light');
}

setDarkTheme() {
  this.themeService.setTheme('dark');
}
```

### Accesso al tema corrente
```typescript
const currentTheme = this.themeService.getCurrentTheme();
this.themeService.currentTheme$.subscribe(theme => {
  console.log('Tema attuale:', theme);
});
```

### Utilizzo nei template
```html
<div [class.active]="currentTheme === 'light'">
  Tema {{ currentTheme }}
</div>
```

## Estensione dei temi

Per aggiungere un nuovo tema, modificare `theme.service.ts`:

```typescript
private themes: Record<ThemeName, ThemeConfig> = {
  dark: { /* ... */ },
  light: { /* ... */ },
  custom: {  // Nuovo tema
    name: 'custom',
    primaryColor: '#...',
    accentColor: '#...',
    backgroundColor: '#...',
    surfaceColor: '#...',
    textPrimary: '#...',
    textSecondary: '#...',
    borderColor: '...',
  }
};
```

E aggiornare il type `ThemeName`:
```typescript
export type ThemeName = 'dark' | 'light' | 'custom';
```

## Componenti interessati

- **app.component.ts**: Contiene il toggle tema nel dropdown profilo
- **theme.service.ts**: Service centrale per la gestione temi
- **styles.scss**: Variabili CSS e sovrascritture per tema chiaro
- **main.ts**: Inizializzazione app con tema salvato

## Browser compatibility

Il sistema utilizza CSS custom properties (variabili CSS), supportate da:
- Chrome 49+
- Firefox 31+
- Safari 9.1+
- Edge 15+

## Performance

- Nessun runtime overhead durante il rendering
- CSS transitions gestite direttamente dal browser
- localStorage per persistenza senza server
- Caricamento tema salvato prima del bootstrap dell'app
