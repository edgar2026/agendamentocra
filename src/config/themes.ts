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
    primary: { hue: 45, saturation: 100, lightness: 50 }, // Amarelo vibrante
    background: { hue: 200, saturation: 80, lightness: 90 }, // Azul-céu claro
    triggerMonth: 1, // Janeiro
  },
  {
    id: 'carnival',
    name: 'Carnaval',
    emoji: '🎭✨🎉',
    description: 'Fundo com confetes e alegria.',
    primary: { hue: 270, saturation: 70, lightness: 50 }, // Roxo
    background: { hue: 60, saturation: 90, lightness: 80 }, // Amarelo claro
    triggerMonth: 2, // Fevereiro (pode se estender a Março dependendo do ano)
  },
  {
    id: 'easter',
    name: 'Páscoa',
    emoji: '🐰🥚🌷',
    description: 'Fundo com ovos e flores.',
    primary: { hue: 270, saturation: 50, lightness: 70 }, // Lilás
    background: { hue: 330, saturation: 60, lightness: 90 }, // Rosa claro
    triggerMonth: 3, // Março (pode se estender a Abril dependendo do ano)
  },
  {
    id: 'mothers-day',
    name: 'Mês das Mães',
    emoji: '💐❤️',
    description: 'Estilo delicado, com flores.',
    primary: { hue: 330, saturation: 70, lightness: 60 }, // Rosa
    background: { hue: 0, saturation: 0, lightness: 100 }, // Branco
    triggerMonth: 5, // Maio
  },
  {
    id: 'sao-joao',
    name: 'São João',
    emoji: '🎆🌽🔥',
    description: 'Fundo de festa junina (bandeirinhas).',
    primary: { hue: 0, saturation: 70, lightness: 50 }, // Vermelho
    background: { hue: 45, saturation: 90, lightness: 70 }, // Amarelo alaranjado
    triggerMonth: 6, // Junho
  },
  {
    id: 'fathers-day',
    name: 'Dia dos Pais',
    emoji: '👔💙',
    description: 'Tema elegante, masculino.',
    primary: { hue: 220, saturation: 60, lightness: 30 }, // Azul escuro
    background: { hue: 210, saturation: 10, lightness: 90 }, // Cinza claro
    triggerMonth: 8, // Agosto
  },
  {
    id: 'september-yellow',
    name: 'Setembro Amarelo',
    emoji: '💛🌻',
    description: 'Fundo com fitas e girassóis.',
    primary: { hue: 50, saturation: 100, lightness: 50 }, // Amarelo
    background: { hue: 0, saturation: 0, lightness: 100 }, // Branco
    triggerMonth: 9, // Setembro
  },
  {
    id: 'october-pink',
    name: 'Outubro Rosa',
    emoji: '🎀🌸',
    description: 'Fundo feminino e inspirador.',
    primary: { hue: 330, saturation: 80, lightness: 70 }, // Rosa claro
    background: { hue: 330, saturation: 60, lightness: 95 }, // Rosa muito claro
    triggerMonth: 10, // Outubro
  },
  {
    id: 'november-blue',
    name: 'Novembro Azul',
    emoji: '💙👨',
    description: 'Fundo clean, com laços azuis.',
    primary: { hue: 210, saturation: 70, lightness: 50 }, // Azul claro
    background: { hue: 210, saturation: 30, lightness: 90 }, // Azul muito claro
    triggerMonth: 11, // Novembro
  },
  {
    id: 'christmas',
    name: 'Natal',
    emoji: '🎄🎅⭐',
    description: 'Fundo natalino com neve e luzes.',
    primary: { hue: 120, saturation: 60, lightness: 30 }, // Verde escuro
    background: { hue: 0, saturation: 70, lightness: 50 }, // Vermelho
    triggerMonth: 12, // Dezembro
    triggerDay: 25, // Dia específico para o Natal
  },
];