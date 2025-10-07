import { Spinner } from '@/components';

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner size={32} />
    </div>
  );
}
