import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function SaveIndicator({ status }) {
  if (!status) return null;

  if (status === "saving") {
    return (
      <div className="flex items-center gap-1 text-sm text-blue-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }

  if (status === "saved") {
    return (
      <div className="flex items-center gap-1 text-sm text-green-600">
        <CheckCircle2 className="w-4 h-4" />
        <span>Saved</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-center gap-1 text-sm text-red-600">
        <AlertCircle className="w-4 h-4" />
        <span>Failed to save</span>
      </div>
    );
  }

  return null;
}