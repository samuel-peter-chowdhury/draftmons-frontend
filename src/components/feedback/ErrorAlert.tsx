import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ErrorAlert({ title = 'Something went wrong', message }: { title?: string; message: string }) {
  return (
    <Alert>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
