import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Eye, EyeOff } from "lucide-react";
import { cleanPhone } from "@/components/phoneUtils";

const SOURCES_DEPRECATED = [
  "Default", "Existing Customers", "Referral", "Meta", "Google pipgurufx.com",
  "Meta pipgurufx.com", "Meta pipgurufx.com SL / GOLD", "Meta pipgurufx.com IN / Ai",
  "Meta pipgurufx.com SL / Ai", "Meta pipgurufx.com IN Tier 1 / Ai", "Shuffled",
  "Email Marketting", "Google", "Google Ai", "Gaming", "Groups", "Suriya Follow ups",
  "Web site", "Exness", "Expo Mumbai", "MM Leads", "Traders Profiler Google",
  "Hot Leads", "Hot Leads Tamil Nadu", "Fresh Database / Test", "Source Riya Test",
  "Neex Shuffled", "Other Broker", "Main Domain", "Indian RPN", "Optimized Leads - forex",
  "campaign", "Indian RPN 2",
];

const EMPTY_FORM = {
  first_name: "", last_name: "", phone: "", email: "", city: "",
  country_code: "", phone_number: "", campaign_name: "",
  language_id: "", status_id: "", source_id: "", notes: "",
  client_feedback: "", investor_password: "", deposit_amount_usd: "",
  last_deposit_date: "", last_withdrawal_sl: "", last_withdrawal_amount: "",
};

export default function LeadFormDialog({ open, onOpenChange, onClose, lead, onSubmit, onSave, isAdmin }) {
  onOpenChange = onOpenChange || onClose;
  onSubmit = onSubmit || onSave;
  const [form, setForm] = useState(EMPTY_FORM);
  const [statuses, setStatuses] = useState([]);
  const [sources, setSources] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const [statusesData, sourcesData, languagesData] = await Promise.all([
          base44.entities.LeadStatus.filter({ is_active: true }),
          base44.entities.LeadSource.filter({ is_active: true }),
          base44.entities.LeadLanguage.filter({ is_active: true }),
        ]);
        setStatuses(statusesData.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
        setSources(sourcesData);
        setLanguages(languagesData);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch configs:", error);
        setLoading(false);
      }
    };
    fetchConfigs();
  }, []);

  useEffect(() => {
    if (lead) {
      setForm({
        first_name: lead.first_name || "",
        last_name: lead.last_name || "",
        phone: lead.phone || "",
        email: lead.email || "",
        city: lead.city || "",
        country_code: lead.country_code || "",
        phone_number: lead.phone_number || "",
        campaign_name: lead.campaign_name || "",
        language_id: lead.language_id || "",
        status_id: lead.status_id || "",
        source_id: lead.source_id || "",
        notes: lead.notes || "",
        client_feedback: lead.client_feedback || "",
        investor_password: lead.investor_password || "",
        deposit_amount_usd: lead.deposit_amount_usd ?? "",
        last_deposit_date: lead.last_deposit_date || "",
        last_withdrawal_sl: lead.last_withdrawal_sl || "",
        last_withdrawal_amount: lead.last_withdrawal_amount ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [lead, open]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    const phone = form.phone ? cleanPhone(form.phone) : "";
    const parsed = {
      ...form,
      phone,
      account_status: "Lead", // Always set to "Lead" for created/imported leads
      deposit_amount_usd: form.deposit_amount_usd !== "" ? parseFloat(form.deposit_amount_usd) : undefined,
      last_withdrawal_amount: form.last_withdrawal_amount !== "" ? parseFloat(form.last_withdrawal_amount) : undefined,
    };
    onSubmit(parsed);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{lead ? "Edit Lead" : "Create Lead"}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading configurations...</div>
        ) : (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">

            {/* Basic Info */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Basic Info</p>
            <div className="grid grid-cols-2 gap-3">
              {[["First Name *", "first_name"], ["Last Name *", "last_name"]].map(([label, key]) => (
                <div key={key}>
                  <Label className="text-xs">{label}</Label>
                  <Input value={form[key] || ""} onChange={(e) => set(key, e.target.value)} className="h-8 mt-1" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Country Code</Label>
                <Input value={form.country_code || ""} onChange={(e) => set("country_code", e.target.value)} placeholder="+1" className="h-8 mt-1" />
              </div>
              <div>
                <Label className="text-xs">Phone Number</Label>
                <Input value={form.phone_number || ""} onChange={(e) => set("phone_number", e.target.value)} placeholder="Without country code" className="h-8 mt-1" />
              </div>
            </div>

            <div>
              <Label className="text-xs">Full Phone (E.164)</Label>
              <Input value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} placeholder="+1234567890" className="h-8 mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Email</Label>
                <Input type="email" value={form.email || ""} onChange={(e) => set("email", e.target.value)} className="h-8 mt-1" />
              </div>
              <div>
                <Label className="text-xs">City</Label>
                <Input value={form.city || ""} onChange={(e) => set("city", e.target.value)} className="h-8 mt-1" />
              </div>
            </div>

            {/* Dropdowns */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">Classification</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={form.status_id} onValueChange={(v) => set("status_id", v)}>
                  <SelectTrigger className="h-8 mt-1"><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>{statuses.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Source</Label>
                {isAdmin ? (
                  <Select value={form.source_id} onValueChange={(v) => set("source_id", v)}>
                    <SelectTrigger className="h-8 mt-1"><SelectValue placeholder="Select source" /></SelectTrigger>
                    <SelectContent>{sources.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <Input value={sources.find(s => s.id === form.source_id)?.name || form.source_id || ""} disabled className="h-8 mt-1 bg-gray-50 text-gray-500" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Language</Label>
                <Select value={form.language_id} onValueChange={(v) => set("language_id", v)}>
                  <SelectTrigger className="h-8 mt-1"><SelectValue placeholder="Select language" /></SelectTrigger>
                  <SelectContent>{languages.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Campaign Name</Label>
                <Input value={form.campaign_name || ""} onChange={isAdmin ? (e) => set("campaign_name", e.target.value) : undefined} disabled={!isAdmin} className={`h-8 mt-1 ${!isAdmin ? "bg-gray-50 text-gray-500" : ""}`} />
              </div>
            </div>

            {/* Account Info */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">Account Info</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Deposit Amount (USD)</Label>
                <Input type="number" value={form.deposit_amount_usd ?? ""} onChange={(e) => set("deposit_amount_usd", e.target.value)} className="h-8 mt-1" />
              </div>
              <div>
                <Label className="text-xs">No Of Calls</Label>
                <Input value={form.no_of_calls ?? 0} disabled className="h-8 mt-1 bg-gray-50 text-gray-500" />
              </div>
            </div>

            <div>
              <Label className="text-xs">Investor Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.investor_password || ""}
                  onChange={(e) => set("investor_password", e.target.value)}
                  className="h-8 pr-8"
                />
                <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Dates */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">Dates</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Last Deposit Date</Label>
                <Input type="date" value={form.last_deposit_date || ""} onChange={(e) => set("last_deposit_date", e.target.value)} className="h-8 mt-1" />
              </div>
              <div>
                <Label className="text-xs">Last Withdrawal Date (SL)</Label>
                <Input type="date" value={form.last_withdrawal_sl || ""} onChange={(e) => set("last_withdrawal_sl", e.target.value)} className="h-8 mt-1" />
              </div>
            </div>

            <div>
              <Label className="text-xs">Last Withdrawal Amount</Label>
              <Input type="number" value={form.last_withdrawal_amount ?? ""} onChange={(e) => set("last_withdrawal_amount", e.target.value)} className="h-8 mt-1" />
            </div>

            {/* Notes & Feedback */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">Notes</p>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} className="mt-1 min-h-[60px]" />
            </div>

            <div>
              <Label className="text-xs">Client Feedback</Label>
              <Textarea value={form.client_feedback || ""} onChange={(e) => set("client_feedback", e.target.value)} className="mt-1 min-h-[60px]" />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700">{lead ? "Update" : "Create"}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}