import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import UserManagement from "@/components/access/UserManagement";
import PermissionsTable from "@/components/access/PermissionsTable";

export default function AccessControl() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        // Redirect non-admin users to Dashboard
        if (user?.role?.toLowerCase() !== 'admin') {
          navigate(createPageUrl("Dashboard"));
        }
      } catch {
        base44.auth.redirectToLogin();
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  if (loading) return <div className="p-8">Loading...</div>;

  // Case-insensitive admin check for consistency
  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';
  
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="border-red-200 bg-red-50 w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h2 className="font-semibold text-red-900">Access Denied</h2>
                <p className="text-sm text-red-700 mt-1">
                  Only administrators can access this page.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Access Control</h1>
        <p className="text-gray-600 mt-1">Manage CRM users, roles, and permissions</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UserManagement currentUser={currentUser} />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <PermissionsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}