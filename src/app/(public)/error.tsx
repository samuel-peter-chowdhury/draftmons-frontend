'use client';
import ErrorAlert from '@/components/feedback/ErrorAlert';

export default function Error({ error }: { error: Error }) {
  return (
    <div className="mx-auto max-w-lg p-4">
      <ErrorAlert message={error.message || 'Unknown error'} />
    </div>
  );
}
