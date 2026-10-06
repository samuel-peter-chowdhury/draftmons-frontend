'use client';

import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle, UserAvatar } from '@/components';
import { CopyableField } from '@/components/comparison';
import { TIMEZONES } from '@/lib/constants';
import { formatUserDisplayName } from '@/lib/utils';
import type { UserInput } from '@/types';

/** Friendly label for an IANA id, falling back to the raw id when it isn't one we list. */
function timezoneLabel(timezone: string): string {
  return TIMEZONES.find((tz) => tz.value === timezone)?.label ?? timezone;
}

function formatLocalTime(timezone: string): string | null {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date());
  } catch {
    // An unknown or malformed IANA id throws RangeError — degrade to just the label.
    return null;
  }
}

export function CoachCard({ user }: { user: UserInput | null | undefined }) {
  const timezone = user?.timezone ?? '';
  const [localTime, setLocalTime] = useState<string | null>(null);

  // Resolved after mount, not during render: the timezone label is deterministic
  // but the current time is not, so formatting it during render would desync the
  // server HTML from the first client render.
  useEffect(() => {
    setLocalTime(timezone ? formatLocalTime(timezone) : null);
  }, [timezone]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coach</CardTitle>
      </CardHeader>
      <CardContent>
        {user ? (
          <>
            <div className="mb-2 flex items-center gap-2">
              <UserAvatar
                avatarUrl={user.avatarUrl}
                name={formatUserDisplayName(user)}
                className="size-10 rounded-full object-cover"
              />
              <span className="truncate text-sm font-medium">{formatUserDisplayName(user)}</span>
            </div>
            <CopyableField label="Discord" value={user.discordUsername ?? ''} />
            <CopyableField label="Showdown" value={user.showdownUsername ?? ''} />
            <div className="py-1">
              <span className="text-xs text-muted-foreground">Timezone</span>
              <p className="truncate text-sm">{timezone ? timezoneLabel(timezone) : '—'}</p>
              {localTime && <p className="text-xs text-muted-foreground">{localTime}</p>}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No coach assigned</p>
        )}
      </CardContent>
    </Card>
  );
}
