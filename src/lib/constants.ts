// Validate required environment variables
const getApiBaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

  if (
    typeof window !== 'undefined' &&
    url.includes('localhost') &&
    process.env.NODE_ENV === 'production'
  ) {
    console.warn('Warning: Using localhost API URL in production');
  }

  return url;
};

const getClientUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3333';

  if (
    typeof window !== 'undefined' &&
    url.includes('localhost') &&
    process.env.NODE_ENV === 'production'
  ) {
    console.warn('Warning: Using localhost client URL in production');
  }

  return url;
};

export const API_BASE_URL = getApiBaseUrl();
export const CLIENT_URL = getClientUrl();

export const BASE_ENDPOINTS = {
  ABILITY_BASE: `${API_BASE_URL}/api/ability`,
  AUTH_STATUS: `${API_BASE_URL}/api/auth/status`,
  AUTH_GOOGLE: `${API_BASE_URL}/api/auth/google`,
  AUTH_LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  GENERATION_BASE: `${API_BASE_URL}/api/generation`,
  LEAGUE_BASE: `${API_BASE_URL}/api/league`,
  LEAGUE_USER_BASE: `${API_BASE_URL}/api/league-user`,
  MOVE_BASE: `${API_BASE_URL}/api/move`,
  POKEMON_BASE: `${API_BASE_URL}/api/pokemon`,
  POKEMON_MOVE_BASE: `${API_BASE_URL}/api/pokemon-move`,
  POKEMON_TYPE_BASE: `${API_BASE_URL}/api/pokemon-type`,
  SEASON_BASE: `${API_BASE_URL}/api/season`,
  SPECIAL_MOVE_CATEGORY_BASE: `${API_BASE_URL}/api/special-move-category`,
  USER_BASE: `${API_BASE_URL}/api/user`,
} as const;

/**
 * IANA timezone identifiers organized by region
 * Used for consistent timezone selection across the application
 */
export const TIMEZONES = [
  // North America
  { value: 'America/New_York', label: 'Eastern Time (ET) - New York' },
  { value: 'America/Chicago', label: 'Central Time (CT) - Chicago' },
  { value: 'America/Denver', label: 'Mountain Time (MT) - Denver' },
  { value: 'America/Phoenix', label: 'Mountain Time (MT) - Phoenix (no DST)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT) - Los Angeles' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT) - Anchorage' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT) - Honolulu' },
  { value: 'America/Toronto', label: 'Eastern Time (ET) - Toronto' },
  { value: 'America/Vancouver', label: 'Pacific Time (PT) - Vancouver' },
  { value: 'America/Mexico_City', label: 'Central Time (CT) - Mexico City' },

  // South America
  { value: 'America/Sao_Paulo', label: 'Brasília Time - São Paulo' },
  { value: 'America/Buenos_Aires', label: 'Argentina Time - Buenos Aires' },
  { value: 'America/Santiago', label: 'Chile Time - Santiago' },
  { value: 'America/Lima', label: 'Peru Time - Lima' },
  { value: 'America/Bogota', label: 'Colombia Time - Bogotá' },

  // Europe
  { value: 'Europe/London', label: 'GMT/BST - London' },
  { value: 'Europe/Paris', label: 'CET/CEST - Paris' },
  { value: 'Europe/Berlin', label: 'CET/CEST - Berlin' },
  { value: 'Europe/Rome', label: 'CET/CEST - Rome' },
  { value: 'Europe/Madrid', label: 'CET/CEST - Madrid' },
  { value: 'Europe/Amsterdam', label: 'CET/CEST - Amsterdam' },
  { value: 'Europe/Brussels', label: 'CET/CEST - Brussels' },
  { value: 'Europe/Vienna', label: 'CET/CEST - Vienna' },
  { value: 'Europe/Stockholm', label: 'CET/CEST - Stockholm' },
  { value: 'Europe/Athens', label: 'EET/EEST - Athens' },
  { value: 'Europe/Istanbul', label: 'Turkey Time - Istanbul' },
  { value: 'Europe/Moscow', label: 'Moscow Time - Moscow' },

  // Asia
  { value: 'Asia/Dubai', label: 'Gulf Time - Dubai' },
  { value: 'Asia/Karachi', label: 'Pakistan Time - Karachi' },
  { value: 'Asia/Kolkata', label: 'India Time - Kolkata' },
  { value: 'Asia/Dhaka', label: 'Bangladesh Time - Dhaka' },
  { value: 'Asia/Bangkok', label: 'Indochina Time - Bangkok' },
  { value: 'Asia/Singapore', label: 'Singapore Time - Singapore' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong Time - Hong Kong' },
  { value: 'Asia/Shanghai', label: 'China Time - Shanghai' },
  { value: 'Asia/Taipei', label: 'Taiwan Time - Taipei' },
  { value: 'Asia/Tokyo', label: 'Japan Time - Tokyo' },
  { value: 'Asia/Seoul', label: 'Korea Time - Seoul' },

  // Pacific
  { value: 'Australia/Sydney', label: 'AEST/AEDT - Sydney' },
  { value: 'Australia/Melbourne', label: 'AEST/AEDT - Melbourne' },
  { value: 'Australia/Brisbane', label: 'AEST - Brisbane (no DST)' },
  { value: 'Australia/Perth', label: 'AWST - Perth' },
  { value: 'Pacific/Auckland', label: 'NZST/NZDT - Auckland' },

  // Africa
  { value: 'Africa/Cairo', label: 'Egypt Time - Cairo' },
  { value: 'Africa/Johannesburg', label: 'South Africa Time - Johannesburg' },
  { value: 'Africa/Lagos', label: 'West Africa Time - Lagos' },
  { value: 'Africa/Nairobi', label: 'East Africa Time - Nairobi' },

  // UTC
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
] as const;
