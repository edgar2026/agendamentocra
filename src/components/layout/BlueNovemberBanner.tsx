import { HeartPulse } from 'lucide-react';

export function BlueNovemberBanner() {
  return (
    <div className="mb-6 p-4 bg-primary/10 rounded-lg shadow-sm text-center border border-primary/20">
      <div className="flex items-center justify-center gap-3">
        <HeartPulse className="h-6 w-6 text-primary" />
        <p className="text-lg font-semibold text-primary">
          Novembro Azul - Se cuide!
        </p>
      </div>
    </div>
  );
}