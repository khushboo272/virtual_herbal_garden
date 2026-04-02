import { Loader2, AlertTriangle, Leaf } from "lucide-react";
import { Button } from "../app/components/ui/button";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <Leaf className="w-8 h-8 text-green-600 animate-pulse" />
        </div>
        <Loader2 className="w-20 h-20 text-green-400 animate-spin absolute -top-2 -left-2" />
      </div>
      <p className="text-green-600 text-sm">{message}</p>
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = "Something went wrong", onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Oops!</h3>
        <p className="text-gray-600 text-sm mb-4">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} className="bg-green-600 hover:bg-green-700">
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title = "No data found", message = "There's nothing here yet", icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
      <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
        {icon || <Leaf className="w-8 h-8 text-green-400" />}
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
        <p className="text-gray-500 text-sm">{message}</p>
      </div>
    </div>
  );
}
