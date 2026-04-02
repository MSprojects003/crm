import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Mail, Clock, Save, Loader2, CheckCircle } from "lucide-react";

const SETTING_KEYS = {
  email_fallback_enabled: { default: "true", description: "Send email when call fails" },
  missed_reminder_email: { default: "true", description: "Send email fallback on missed reminder" },
  default_reminder_minutes: { default: "15", description: "Default minutes before reminder fires" },
  overdue_auto_email: { default: "false", description: "Auto email lead when reminder is missed" },
  missed_reminder_rule: { default: "email", description: "What to do when a reminder is missed" },
};

export default function ReminderSettings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [emailFallback, setEmailFallback] = useState(true);
  const [missedReminderEmail, setMissedReminderEmail] = useState(true);
  const [defaultMinutes, setDefaultMinutes] = useState("15");
  const [overdueAutoEmail, setOverdueAutoEmail] = useState(false);
  const [missedRule, setMissedRule] = useState("email");

  useEffect(() => {
    base44.entities.AppSettings.list().then(data => {
      setSettings(data);
      const get = (key) => data.find(s => s.key === key)?.value ?? SETTING_KEYS[key].default;
      setEmailFallback(get("email_fallback_enabled") === "true");
      setMissedReminderEmail(get("missed_reminder_email") === "true");
      setDefaultMinutes(get("default_reminder_minutes"));
      setOverdueAutoEmail(get("overdue_auto_email") === "true");
      setMissedRule(get("missed_reminder_rule"));
      setLoading(false);
    });
  }, []);

  const upsert = async (key, value) => {
    const existing = settings.find(s => s.key === key);
    if (existing) return base44.entities.AppSettings.update(existing.id, { value });
    return base44.entities.AppSettings.create({ key, value, description: SETTING_KEYS[key].description });
  };

  const handleSave = async () => {
    setSaving(true);
    await Promise.all([
      upsert("email_fallback_enabled", String(emailFallback)),
      upsert("missed_reminder_email", String(missedReminderEmail)),
      upsert("default_reminder_minutes", defaultMinutes),
      upsert("overdue_auto_email", String(overdueAutoEmail)),
      upsert("missed_reminder_rule", missedRule),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <div className="py-10 text-center text-gray-400 text-sm">Loading...</div>;

  return (
    <div className="space-y-5">
      {/* Default Timing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4 text-blue-600" /> Default Reminder Time
          </CardTitle>
          <CardDescription>How many minutes before due time to show the popup</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Input
              type="number" min="1" max="120"
              value={defaultMinutes}
              onChange={e => setDefaultMinutes(e.target.value)}
              className="h-9 w-28"
            />
            <span className="text-sm text-gray-500">minutes before due</span>
          </div>
        </CardContent>
      </Card>

      {/* Email Fallback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="w-4 h-4 text-purple-600" /> Email Fallback
          </CardTitle>
          <CardDescription>Auto-send emails when calls or reminders are missed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Email fallback on failed call</p>
              <p className="text-xs text-gray-400">Send email to lead when a call is unanswered</p>
            </div>
            <Switch checked={emailFallback} onCheckedChange={setEmailFallback} />
          </div>
          <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Email fallback on missed reminder</p>
              <p className="text-xs text-gray-400">Send email to lead when a reminder is marked missed</p>
            </div>
            <Switch checked={missedReminderEmail} onCheckedChange={setMissedReminderEmail} />
          </div>
          <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Auto-email on overdue reminders</p>
              <p className="text-xs text-gray-400">Automatically email leads with overdue pending reminders</p>
            </div>
            <Switch checked={overdueAutoEmail} onCheckedChange={setOverdueAutoEmail} />
          </div>
        </CardContent>
      </Card>

      {/* Missed Reminder Rule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="w-4 h-4 text-orange-500" /> Missed Reminder Rule
          </CardTitle>
          <CardDescription>What happens when a reminder is missed</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={missedRule} onValueChange={setMissedRule}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Send email to lead</SelectItem>
              <SelectItem value="reassign">Reassign to next available agent</SelectItem>
              <SelectItem value="nothing">Do nothing (manual handling)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className={`gap-2 ${saved ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"} text-white`}
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> :
            saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> :
            <><Save className="w-4 h-4" /> Save Settings</>}
        </Button>
      </div>
    </div>
  );
}