import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export const Loading = ({ message = 'Loading…', size = 'md' }: LoadingProps) => (
  <div className="flex min-h-[200px] flex-col items-center justify-center gap-3">
    <Loader2 className={`${sizeClasses[size]} animate-spin text-foreground/70`} />
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

export const PageLoading = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
    <Loader2 className="h-6 w-6 animate-spin text-foreground/70" />
    <p className="text-sm text-muted-foreground">Loading…</p>
  </div>
);

export default Loading;
