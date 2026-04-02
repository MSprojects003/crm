import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import LeadConfig from "@/components/settings/LeadConfig";
import ReminderSettings from "@/components/settings/ReminderSettings";
import FollowUpSequenceManager from "@/components/followups/FollowUpSequenceManager";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Settings() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') {
        navigate(createPageUrl("Dashboard"));
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6" /> Settings
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage users, lead configuration, and automation</p>
      </div>

      <Tabs defaultValue="leads">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="leads">Lead Config</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="followups">Follow-Ups</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="mt-5">
          <LeadConfig />
        </TabsContent>

        <TabsContent value="reminders" className="mt-5">
          <ReminderSettings />
        </TabsContent>

        <TabsContent value="followups" className="mt-5">
          <FollowUpSequenceManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}