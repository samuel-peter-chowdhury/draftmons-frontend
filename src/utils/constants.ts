export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export const ROUTES = {
  HOME: '/home',
  LOGIN: '/',
  LEAGUES: '/leagues',
  POKEMON: '/pokemon',
} as const;

export const SIDEBAR_NAVIGATION = [
  {
    id: 'team-matchup',
    label: 'Team Matchup',
    icon: 'Groups',
    path: '/team-matchup',
    children: [],
  },
  {
    id: 'tiers',
    label: 'Tiers',
    icon: 'Layers',
    path: '/tiers',
    children: [
      { id: 'classic', label: 'Classic', path: '/tiers/classic' },
      { id: 'type', label: 'Type', path: '/tiers/type' },
    ],
  },
  {
    id: 'rank',
    label: 'Rank',
    icon: 'EmojiEvents',
    path: '/rank',
    children: [
      { id: 'team', label: 'Team', path: '/rank/team' },
      { id: 'pokemon', label: 'Pokemon', path: '/rank/pokemon' },
    ],
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: 'Build',
    path: '/tools',
    children: [
      { id: 'rosters', label: 'Rosters', path: '/tools/rosters' },
      { id: 'schedule', label: 'Schedule', path: '/tools/schedule' },
      { id: 'search', label: 'Search', path: '/tools/search' },
      { id: 'rules', label: 'Rules', path: '/tools/rules' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: 'AdminPanelSettings',
    path: '/admin',
    children: [
      { id: 'modify-team', label: 'Modify Team', path: '/admin/modify-team' },
      { id: 'modify-tiers', label: 'Modify Tiers', path: '/admin/modify-tiers' },
      { id: 'submit-match', label: 'Submit Match', path: '/admin/submit-match' },
    ],
  },
];

export const SIDEBAR_BOTTOM_NAVIGATION = [
  {
    id: 'team-settings',
    label: 'Team Settings',
    icon: 'Settings',
    path: '/team-settings',
    children: [],
  },
];