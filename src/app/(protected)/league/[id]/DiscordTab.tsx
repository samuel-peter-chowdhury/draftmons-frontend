'use client';

import { useState } from 'react';
import { ExternalLink, MessageSquare } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner,
  ErrorAlert,
} from '@/components';
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
import { useAuthStore } from '@/stores';
import type { LeagueInput, DiscordGuild, DiscordChannel, DiscordInviteUrl } from '@/types';

interface DiscordTabProps {
  leagueId: number;
  league: LeagueInput;
  onUpdate: () => void;
}

export function DiscordTab({ leagueId, league, onUpdate }: DiscordTabProps) {
  const { user } = useAuthStore();
  const hasDiscordLinked = !!user?.hasDiscordLinked;

  const [selectedGuildId, setSelectedGuildId] = useState<string>('');
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false);

  const {
    data: guilds,
    loading: guildsLoading,
    error: guildsError,
    refetch: refetchGuilds,
  } = useFetch<DiscordGuild[]>(BASE_ENDPOINTS.DISCORD_GUILDS);

  const { data: inviteUrlData } = useFetch<DiscordInviteUrl>(BASE_ENDPOINTS.DISCORD_INVITE_URL);

  const channelsFetchGuildId = selectedGuildId || league.discordGuildId;
  const { data: channels, loading: channelsLoading } = useFetch<DiscordChannel[]>(
    channelsFetchGuildId ? `${BASE_ENDPOINTS.DISCORD_GUILDS}/${channelsFetchGuildId}/channels` : null,
  );

  const isConnected = !!league.discordGuildId && !!league.discordChannelId;
  const hasNoGuilds = !guildsLoading && guilds !== null && guilds.length === 0;

  const connectedGuild = guilds?.find((g) => g.id === league.discordGuildId);
  const connectedGuildName = connectedGuild?.name ?? league.discordGuildId ?? 'Unknown Server';
  const connectedChannel = channels?.find((c) => c.id === league.discordChannelId);
  const connectedChannelName = connectedChannel?.name ?? league.discordChannelId ?? 'Unknown Channel';

  const saveMutation = useMutation(
    ({ guildId, channelId }: { guildId: string; channelId: string }) =>
      LeagueApi.update(leagueId, {
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
    () =>
      LeagueApi.update(leagueId, {
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
    try {
      await saveMutation.mutate({ guildId: selectedGuildId, channelId: selectedChannelId });
    } catch {
      // error surfaced via saveMutation.error
    }
  };

  // Discord account not linked state
  if (!hasDiscordLinked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Link Discord Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Link your Discord account to your profile to select a server. This lets us verify your
            server membership.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-[#5865F2]/30 text-[#5865F2] hover:bg-[#5865F2]/10"
            asChild
          >
            <a href={'/user/' + user?.id}>
              <MessageSquare className="h-4 w-4" />
              Go to Profile
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (guildsError) {
    return (
      <Card>
        <CardContent className="space-y-3 py-8 text-center">
          <ErrorAlert message={guildsError} />
          <Button variant="ghost" size="sm" onClick={refetchGuilds}>
            Retry
          </Button>
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
              <div className="h-2.5 w-2.5 rounded-full bg-success" />
              <Badge className="border-success bg-success/20 text-success" variant="outline">
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
                <span className="font-medium">#{connectedChannelName}</span>
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
                onClick={async () => {
                  try {
                    await disconnectMutation.mutate();
                  } catch {
                    // error surfaced via disconnectMutation.error
                  }
                }}
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
    <div className="space-y-4">
      {!isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Add Bot to Server</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Invite the Draftmons bot to your Discord server to enable league commands and
              notifications.
            </p>
            {inviteUrlData?.url && (
              <Button variant="secondary" size="sm" asChild>
                <a href={inviteUrlData.url} target="_blank" rel="noopener noreferrer">
                  Invite Bot
                  <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {hasNoGuilds && !isConnected ? (
        <Card>
          <CardHeader>
            <CardTitle>No Servers Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              The Draftmons bot hasn&apos;t been added to any Discord servers yet. Use the invite
              button above to add it to your server, then refresh this page.
            </p>
            <Button variant="ghost" size="sm" onClick={refetchGuilds}>
              Refresh
            </Button>
          </CardContent>
        </Card>
      ) : (
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
      )}
    </div>
  );
}
