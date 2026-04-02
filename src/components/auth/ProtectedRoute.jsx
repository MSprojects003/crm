import { can } from "@/components/auth/auth";
import { ShieldOff } from "lucide-react";

export default function ProtectedRoute({ user, permission, children }) {
  if (!user) return null;

  if (permission && !can(user, permission)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
        <ShieldOff className="w-10 h-10" />
        <p className="text-lg font-medium">Access Denied</p>
        <p className="text-sm">You don't have permission to view this page.</p>
      </div>
    );
  }

  return children;
}