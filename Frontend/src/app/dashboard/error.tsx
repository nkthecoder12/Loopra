"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-premium-lg border border-border bg-surface p-8 text-center shadow-soft">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <AlertCircle size={22} />
        </div>
        <h2 className="mt-5 text-2xl font-extrabold text-text-primary">Something paused the ride flow</h2>
        <p className="mt-2 text-sm font-medium text-text-secondary">Refresh this view and Loopra will reconnect to your active ride state.</p>
        <Button onClick={reset} className="mt-6 w-full">
          <RotateCcw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}
