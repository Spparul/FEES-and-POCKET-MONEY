export type ThemeId = 'heritage' | 'classic' | 'forest' | 'burgundy' | 'midnight';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  subtitle: string;
  headerBg: string;
  pageBg: string;
  cardBg: string;
  accent: string;
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'heritage',
    name: 'Heritage Ledger',
    subtitle: 'Warm cream paper & deep forest green ink (Default)',
    headerBg: '#1c3829',
    pageBg: '#fcfaf2',
    cardBg: '#ffffff',
    accent: '#c5a059',
  },
  {
    id: 'classic',
    name: 'Classic School',
    subtitle: 'Soft ivory & deep academic navy',
    headerBg: '#1b2a4a',
    pageBg: '#fbfbfa',
    cardBg: '#ffffff',
    accent: '#722f37',
  },
  {
    id: 'forest',
    name: 'Forest Ledger',
    subtitle: 'Warm gray paper & quiet sage accents',
    headerBg: '#1e352b',
    pageBg: '#f4f5f2',
    cardBg: '#ffffff',
    accent: '#52796f',
  },
  {
    id: 'burgundy',
    name: 'Burgundy Ledger',
    subtitle: 'Rich cream & deep academic burgundy',
    headerBg: '#4a1525',
    pageBg: '#fdfbf7',
    cardBg: '#ffffff',
    accent: '#b8924b',
  },
  {
    id: 'midnight',
    name: 'Midnight Register',
    subtitle: 'Dark ink paper & gold highlights (Dark Mode)',
    headerBg: '#121614',
    pageBg: '#181e1b',
    cardBg: '#212925',
    accent: '#d4af37',
  },
];
