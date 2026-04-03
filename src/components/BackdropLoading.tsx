import { Loader2 } from 'lucide-react';
import { useLoading } from '../providers/LoadingProvider';

const BackdropLoading = () => {
  const { isLoading } = useLoading();
  if (!isLoading) return null;
  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/50 text-primary-foreground"
      aria-busy="true"
      aria-live="polite"
    >
      <Loader2 className="size-10 animate-spin text-white" />
    </div>
  );
};

export default BackdropLoading;
