import { HeartPulse } from 'lucide-react';

export function PinkOctoberBanner() {
  return (
    <div className="mb-6 p-4 bg-gradient-primary rounded-lg shadow-lg text-center border border-primary/20 text-white">
      <div className="flex items-center justify-center gap-3">
        <HeartPulse className="h-6 w-6" />
        <p className="text-lg font-semibold">
          Outubro Rosa - Se previna!
        </p>
      </div>
    </div>
  );
}