import { memo } from 'react';

export const NoTeamSelected = memo(function NoTeamSelected({
  message,
}: {
  message: string;
}) {
  return (
    <p className="py-6 text-center text-sm text-muted-foreground">{message}</p>
  );
});
