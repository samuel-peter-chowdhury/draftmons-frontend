'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner,
  ErrorAlert,
} from '@/components';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useFetch, useMutation } from '@/hooks';
import { LeagueApi } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { LeagueInput, DiscordGuild, DiscordChannel } from '@/types';

interface DiscordTabProps {
  leagueId: number;
  league: LeagueInput;
  onUpdate: () => void;
}

export function DiscordTab({ leagueId, league, onUpdate }: DiscordTabProps) {
  const [selectedGuildId, setSelectedGuildId] = useState<string>('');
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false);

  const { data: guilds, loading: guildsLoading, error: guildsError } = useFetch<DiscordGuild[]>(
    BASE_ENDPOINTS.DISCORD_GUILDS,
  );

  const { data: channels, loading: channelsLoading } = useFetch<DiscordChannel[]>(
    selectedGuildId ? `${BASE_ENDPOINTS.DISCORD_GUILDS}/${selectedGuildId}/channels` : null,
  );

  const isConnected = !!league.discordGuildId && !!league.discordChannelId;
  const isBotDisabled = guildsError !== null;

  const connectedGuild = guilds?.find((g) => g.id === league.discordGuildId);
  const connectedGuildName = connectedGuild?.name ?? league.discordGuildId ?? 'Unknown Server';
  const connectedChannelId = league.discordChannelId;

  const saveMutation = useMutation(
    ({ guildId, channelId }: { guildId: string; channelId: string }) =>
      LeagueApi.update(leagueId, {
        name: league.name,
        abbreviation: league.abbreviation,
        discordGuildId: guildId,
        discordChannelId: channelId,
      }),
    {
      onSuccess: () => {
        setIsEditing(false);
        setSelectedGuildId('');
        setSelectedChannelId('');
        onUpdate();
      },
    },
  );

  const disconnectMutation = useMutation<LeagueInput, void>(
    (_v) =>
      LeagueApi.update(leagueId, {
        name: league.name,
        abbreviation: league.abbreviation,
        discordGuildId: null,
        discordChannelId: null,
      }),
    {
      onSuccess: () => {
        setIsDisconnectDialogOpen(false);
        onUpdate();
      },
    },
  );

  const handleGuildChange = (guildId: string) => {
    setSelectedGuildId(guildId);
    setSelectedChannelId('');
  };

  const handleStartEditing = () => {
    setSelectedGuildId(league.discordGuildId ?? '');
    setSelectedChannelId(league.discordChannelId ?? '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!selectedGuildId || !selectedChannelId) return;
    await saveMutation.mutate({ guildId: selectedGuildId, channelId: selectedChannelId });
  };

  // Bot disabled state
  if (isBotDisabled) {
    return (
      <Card className="opacity-60">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            Discord bot is not configured on this server. Contact your administrator.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Loading guilds
  if (guildsLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spinner size={32} />
      </div>
    );
  }

  // Connected state (not editing)
  if (isConnected && !isEditing) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <Badge
                className="border-green-500 bg-green-500/20 text-green-400"
                variant="outline"
              >
                Connected
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">Server: </span>
                <span className="font-medium">{connectedGuildName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Channel: </span>
                <span className="font-medium">#{connectedChannelId}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleStartEditing}>
                Change Server
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDisconnectDialogOpen(true)}
              >
                Disconnect
              </Button>
            </div>
            {disconnectMutation.error && <ErrorAlert message={disconnectMutation.error} />}
          </CardContent>
        </Card>

        <AlertDialog open={isDisconnectDialogOpen} onOpenChange={setIsDisconnectDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect Discord?</AlertDialogTitle>
              <AlertDialogDescription>
                This will stop notifications from posting to {connectedGuildName}. You can
                reconnect any time.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={disconnectMutation.loading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.loading}
              >
                {disconnectMutation.loading ? <Spinner size={18} /> : 'Disconnect'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Disconnected / editing state
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect Discord</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Server</label>
            <Select
              value={selectedGuildId}
              onChange={(e) => handleGuildChange(e.target.value)}
            >
              <option value="">Select a server...</option>
              {guilds?.map((guild) => {
                const isLinkedToOther =
                  guild.linkedLeagueName !== null && guild.linkedLeagueName !== league.name;
                return (
                  <option key={guild.id} value={guild.id} disabled={isLinkedToOther}>
                    {guild.name}
                    {isLinkedToOther && ` (linked to ${guild.linkedLeagueName})`}
                  </option>
                );
              })}
            </Select>
          </div>

          {selectedGuildId && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Channel</label>
              {channelsLoading ? (
                <div className="flex items-center gap-2 py-2">
                  <Spinner size={18} />
                  <span className="text-sm text-muted-foreground">Loading channels...</span>
                </div>
              ) : (
                <Select
                  value={selectedChannelId}
                  onChange={(e) => setSelectedChannelId(e.target.value)}
                >
                  <option value="">Select a channel...</option>
                  {channels?.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      #{channel.name}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          )}
        </div>

        {saveMutation.error && <ErrorAlert message={saveMutation.error} />}

        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={!selectedGuildId || !selectedChannelId || saveMutation.loading}
            size="sm"
          >
            {saveMutation.loading ? <Spinner size={18} /> : 'Save'}
          </Button>
          {isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsEditing(false);
                setSelectedGuildId('');
                setSelectedChannelId('');
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
