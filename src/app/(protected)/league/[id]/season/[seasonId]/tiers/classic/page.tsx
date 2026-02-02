'use client';

import { useParams } from 'next/navigation';

export default function Page() {
  const params = useParams<{ id: string; seasonId: string }>();
  return (
    <div className="mx-auto max-w-7xl p-4">
      <h1 className="text-2xl font-semibold mb-2">/league/{params.id}/season/{params.seasonId}/tiers/classic</h1>
      <p className="text-muted-foreground">This section is scaffolded and ready for future functionality.</p>
    </div>
  );
}
