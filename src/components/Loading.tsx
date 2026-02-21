import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export const Loading = ({ message = 'Loading...', size = 'md' }: LoadingProps) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
    <Loader2 className={`${sizeClasses[size]} text-primary animate-spin`} />
    <p className="text-sm text-foreground/60 font-medium">{message}</p>
  </div>
);

export const PageLoading = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-mesh">
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
        <Loader2 className="w-12 h-12 text-primary animate-spin relative" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-foreground">Loading Bitcoin Will</p>
        <p className="text-sm text-foreground/60">Initializing cryptographic libraries...</p>
      </div>
    </div>
  </div>
);

export default Loading;
