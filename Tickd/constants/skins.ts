import { ImageSourcePropType } from "react-native";

export type Skin = {
  id: string;
  name: string;
  description: string;
  cost: number;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryBorder: string;
};

export const SKINS: Skin[] = [
  {
    id: 'default',
    name: 'Forest',
    description: 'The classic Tickd green',
    cost: 0,
    primary: '#4CAF50',
    primaryLight: '#E8F5E9',
    primaryDark: '#2E7D32',
    primaryBorder: '#C8E6C9',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Cool ocean blue vibes',
    cost: 50,
    primary: '#2196F3',
    primaryLight: '#E3F2FD',
    primaryDark: '#1565C0',
    primaryBorder: '#BBDEFB',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm sunset orange',
    cost: 75,
    primary: '#FF5722',
    primaryLight: '#FBE9E7',
    primaryDark: '#BF360C',
    primaryBorder: '#FFCCBC',
  },
  {
    id: 'lavender',
    name: 'Lavender',
    description: 'Soft purple hues',
    cost: 100,
    primary: '#9C27B0',
    primaryLight: '#F3E5F5',
    primaryDark: '#6A1B9A',
    primaryBorder: '#E1BEE7',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep indigo night sky',
    cost: 150,
    primary: '#3F51B5',
    primaryLight: '#E8EAF6',
    primaryDark: '#1A237E',
    primaryBorder: '#C5CAE9',
  },
  {
    id: 'rose',
    name: 'Rose Gold',
    description: 'Elegant rose gold tones',
    cost: 75,
    primary: '#E91E63',
    primaryLight: '#FCE4EC',
    primaryDark: '#880E4F',
    primaryBorder: '#F8BBD9',
  },
];

export const DEFAULT_SKIN = SKINS[0];

export function getSkinById(id: string): Skin {
  return SKINS.find((s) => s.id === id) ?? DEFAULT_SKIN;
}
