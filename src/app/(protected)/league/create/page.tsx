'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, CardHeader, CardTitle, ErrorAlert, Input, Label, Spinner } from '@/components';
import { Api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/constants';
import type { LeagueInputDto, LeagueOutputDto } from '@/types';

export default function CreateLeaguePage() {
  const router = useRouter();
  const [form, setForm] = useState<LeagueOutputDto>({ name: '', abbreviation: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const created = await Api.post<LeagueInputDto>(ENDPOINTS.LEAGUE_BASE, form);
      router.replace(`/league/${created.id}`);
    } catch (e) {
      const error = e as { body?: { message?: string }; message?: string };
      setError(error?.body?.message || error?.message || 'Failed to create league');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>Create League</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-3"><ErrorAlert message={error} /></div>}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="abbr">Abbreviation</Label>
              <Input
                id="abbr"
                value={form.abbreviation}
                onChange={(e) => setForm((f) => ({ ...f, abbreviation: e.target.value }))}
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? <Spinner size={18} /> : 'Create'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
