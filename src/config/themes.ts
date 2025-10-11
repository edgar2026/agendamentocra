export type ThemeId = 'default' | 'summer' | 'carnival' | 'easter' | 'mothers-day' | 'sao-joao' | 'fathers-day' | 'september-yellow' | 'october-pink' | 'november-blue' | 'christmas';

export interface ThemeColor {
  hue: number;
  saturation: number;
  lightness: number;
}

export interface Theme {
  id: ThemeId;
  name: string;
  emoji: string;
  description: string;
  primary: ThemeColor;
  primaryForeground: ThemeColor; // Cor do texto sobre a cor primária
  background: ThemeColor;
  triggerMonth?: number; // 1-12
  triggerDay?: number; // 1-31 (for specific dates like Christmas)
}

export const themes: Theme[] = [
  {
    id: 'default',
    name: 'Padrão UNINASSAU',
    emoji: '🗓️',
    description: 'Tema padrão da UNINASSAU.',
    primary: { hue: 200, saturation: 80, lightness: 35 },
    primaryForeground: { hue: 0, saturation: 0, lightness: 100 },
    background: { hue: 210, saturation: 36, lightness: 97 },
  },
  {
    id: 'summer',
    name: 'Verão',
    emoji: '🌞🏖️',
    description: 'Fundo ensolarado, estilo praiano.',
    primary: { hue: 35, saturation: 85, lightness: 52 },
    primaryForeground: { hue: 20, saturation: 15, lightness: 10 },
    background: { hue: 45, saturation: 100, lightness: 96 },
  },
  {
    id: 'carnival',
    name: 'Carnaval',
    emoji: '🎭✨🎉',
    description: 'Fundo com confetes e alegria.',
    primary: { hue: 280, saturation: 80, lightness: 58 },
    primaryForeground: { hue: 0, saturation: 0, lightness: 100 },
    background: { hue: 50, saturation: 100, lightness: 97 },
  },
  {
    id: 'easter',
    name: 'Páscoa',
    emoji: '🐰🥚🌷',
    description: 'Fundo com ovos e flores.',
    primary: { hue: 265, saturation: 60, lightness: 65 },
    primaryForeground: { hue: 0, saturation: 0, lightness: 100 },
    background: { hue: 120, saturation: 60, lightness: 96 },
  },
  {
    id: 'mothers-day',
    name: 'Mês das Mães',
    emoji: '💐❤️',
    description: 'Estilo delicado, com flores.',
    primary: { hue: 340, saturation: 82, lightness: 60 },
    primaryForeground: { hue: 0, saturation: 0, lightness: 100 },
    background: { hue: 340, saturation: 100, lightness: 98 },
  },
  {
    id: 'sao-joao',
    name: 'São João',
    emoji: '🎆🌽🔥',
    description: 'Fundo de festa junina.',
    primary: { hue: 15, saturation: 80, lightness: 50 },
    primaryForeground: { hue: 0, saturation: 0, lightness: 100 },
    background: { hue: 40, saturation: 55, lightness: 95 },
  },
  {
    id: 'fathers-day',
    name: 'Dia dos Pais',
    emoji: '👔💙',
    description: 'Tema elegante, masculino.',
    primary: { hue: 220, saturation: 60, lightness: 40 },
    primaryForeground: { hue: 0, saturation: 0, lightness: 100 },
    background: { hue: 210, saturation: 20, lightness: 94 },
  },
  {
    id: 'september-yellow',
    name: 'Setembro Amarelo',
    emoji: '💛🌻',
    description: 'Fundo com fitas e girassóis.',
    primary: { hue: 48, saturation: 95, lightness: 48 },
    primaryForeground: { hue: 50, saturation: 25, lightness: 10 },
    background: { hue: 50, saturation: 100, lightness: 97 },
  },
  {
    id: 'october-pink',
    name: 'Outubro Rosa',
    emoji: '🎀🌸',
    description: 'Fundo feminino e inspirador.',
    primary: { hue: 335, saturation: 85, lightness: 55 },
    primaryForeground: { hue: 0, saturation: 0, lightness: 100 },
    background: { hue: 340, saturation: 100, lightness: 98 },
  },
  {
    id: 'november-blue',
    name: 'Novembro Azul',
    emoji: '💙👨',
    description: 'Fundo clean, com laços azuis.',
    primary: { hue: 215, saturation: 70, lightness: 48 },
    primaryForeground: { hue: 0, saturation: 0, lightness: 100 },
    background: { hue: 210, saturation: 100, lightness: 97 },
  },
  {
    id: 'christmas',
    name: 'Natal',
    emoji: '🎄🎅⭐',
    description: 'Fundo natalino com neve e luzes.',
    primary: { hue: 0, saturation: 65, lightness: 45 },
    primaryForeground: { hue: 0, saturation: 0, lightness: 100 },
    background: { hue: 30, saturation: 40, lightness: 96 },
  },
];