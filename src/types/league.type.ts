import { BaseInput, BaseOutput } from './base.type';
import { LeagueUserInput } from './leagueUser.type';
import { SeasonInput } from './season.type';

export interface LeagueInput extends BaseInput {
  name: string;
  abbreviation: string;
  discordGuildId?: string | null;
  discordChannelId?: string | null;
  leagueUsers?: LeagueUserInput[];
  seasons?: SeasonInput[];
}

export interface LeagueOutput extends BaseOutput {
  name: string;
  abbreviation: string;
  discordGuildId?: string | null;
  discordChannelId?: string | null;
}
