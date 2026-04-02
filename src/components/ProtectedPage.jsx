import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ProtectedPage({ authorized, children }) {
  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="border-red-200 bg-red-50 w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h2 className="font-semibold text-red-900">Access Denied</h2>
                <p className="text-sm text-red-700 mt-1">
                  You don't have permission to access this page.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return children;
}