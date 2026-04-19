import { Api } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { DiscordGuild, DiscordChannel, DiscordInviteUrl } from '@/types';

export const DiscordApi = {
  getGuilds: () => Api.get<DiscordGuild[]>(BASE_ENDPOINTS.DISCORD_GUILDS),

  getChannels: (guildId: string) =>
    Api.get<DiscordChannel[]>(`${BASE_ENDPOINTS.DISCORD_GUILDS}/${guildId}/channels`),

  getInviteUrl: () => Api.get<DiscordInviteUrl>(BASE_ENDPOINTS.DISCORD_INVITE_URL),
};
