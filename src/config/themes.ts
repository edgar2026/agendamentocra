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
    primary: { hue: 200, saturation: 80, lightness: 35 }, // Azul teal
    background: { hue: 210, saturation: 36, lightness: 97 }, // Cinza muito claro
  },
  {
    id: 'summer',
    name: 'Verão',
    emoji: '🌞🏖️',
    description: 'Fundo ensolarado, estilo praiano.',
    primary: { hue: 35, saturation: 85, lightness: 52 }, // Laranja-sol
    background: { hue: 45, saturation: 100, lightness: 96 }, // Amarelo bem claro (areia)
  },
  {
    id: 'carnival',
    name: 'Carnaval',
    emoji: '🎭✨🎉',
    description: 'Fundo com confetes e alegria.',
    primary: { hue: 280, saturation: 80, lightness: 58 }, // Roxo vibrante
    background: { hue: 50, saturation: 100, lightness: 97 }, // Amarelo pastel
  },
  {
    id: 'easter',
    name: 'Páscoa',
    emoji: '🐰🥚🌷',
    description: 'Fundo com ovos e flores.',
    primary: { hue: 265, saturation: 60, lightness: 65 }, // Lilás suave
    background: { hue: 120, saturation: 60, lightness: 96 }, // Verde menta bem claro
  },
  {
    id: 'mothers-day',
    name: 'Mês das Mães',
    emoji: '💐❤️',
    description: 'Estilo delicado, com flores.',
    primary: { hue: 340, saturation: 82, lightness: 60 }, // Rosa rico
    background: { hue: 340, saturation: 100, lightness: 98 }, // Fundo rosa muito pálido
  },
  {
    id: 'sao-joao',
    name: 'São João',
    emoji: '🎆🌽🔥',
    description: 'Fundo de festa junina (bandeirinhas).',
    primary: { hue: 15, saturation: 80, lightness: 50 }, // Laranja-vermelho (fogueira)
    background: { hue: 40, saturation: 55, lightness: 95 }, // Bege claro (palha)
  },
  {
    id: 'fathers-day',
    name: 'Dia dos Pais',
    emoji: '👔💙',
    description: 'Tema elegante, masculino.',
    primary: { hue: 220, saturation: 60, lightness: 40 }, // Azul marinho
    background: { hue: 210, saturation: 20, lightness: 94 }, // Cinza azulado claro
  },
  {
    id: 'september-yellow',
    name: 'Setembro Amarelo',
    emoji: '💛🌻',
    description: 'Fundo com fitas e girassóis.',
    primary: { hue: 48, saturation: 95, lightness: 48 }, // Amarelo-ouro
    background: { hue: 50, saturation: 100, lightness: 97 }, // Amarelo muito pálido
  },
  {
    id: 'october-pink',
    name: 'Outubro Rosa',
    emoji: '🎀🌸',
    description: 'Fundo feminino e inspirador.',
    primary: { hue: 335, saturation: 85, lightness: 55 }, // Rosa forte
    background: { hue: 340, saturation: 100, lightness: 98 }, // Rosa extremamente claro
  },
  {
    id: 'november-blue',
    name: 'Novembro Azul',
    emoji: '💙👨',
    description: 'Fundo clean, com laços azuis.',
    primary: { hue: 215, saturation: 70, lightness: 48 }, // Azul royal
    background: { hue: 210, saturation: 100, lightness: 97 }, // Azul muito claro
  },
  {
    id: 'christmas',
    name: 'Natal',
    emoji: '🎄🎅⭐',
    description: 'Fundo natalino com neve e luzes.',
    primary: { hue: 0, saturation: 65, lightness: 45 }, // Vermelho natalino
    background: { hue: 30, saturation: 40, lightness: 96 }, // Fundo marfim/creme
  },
];