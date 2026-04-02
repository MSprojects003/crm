import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone } from "lucide-react";

export default function LeadOverviewSection({ lead, users, changes, onFieldChange, onCallClick }) {
  const [statuses, setStatuses] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [sources, setSources] = useState([]);
  const [showCustomSource, setShowCustomSource] = useState(false);
  const [showCustomLanguage, setShowCustomLanguage] = useState(false);

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const [statusesData, languagesData, sourcesData] = await Promise.all([
        base44.entities.LeadStatus.filter({ is_active: true }),
        base44.entities.LeadLanguage.filter({ is_active: true }),
        base44.entities.LeadSource.filter({ is_active: true })]
        );
        setStatuses(statusesData.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
        setLanguages(languagesData);
        setSources(sourcesData);
      } catch (error) {
        console.error("Failed to fetch configs:", error);
      }
    };
    fetchConfigs();
  }, []);

  const getFieldValue = (field) => changes[field] !== undefined ? changes[field] : lead[field] || "";

  const currentSource = getFieldValue("source_id");
  const currentLanguage = getFieldValue("language_id");
  const currentStatus = getFieldValue("status_id");

  const sourceInList = sources.find((s) => s.id === currentSource);
  const isCustomSource = showCustomSource || currentSource && !sourceInList;
  const sourceSelectValue = isCustomSource ? "__custom__" : currentSource || "";

  const languageInList = languages.find((l) => l.id === currentLanguage);
  const isCustomLanguage = showCustomLanguage || currentLanguage && !languageInList;
  const languageSelectValue = isCustomLanguage ? "__custom__" : currentLanguage || "";

  return (
    <div className="space-y-8">
      {/* Basic Info */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Email</Label>
            <Input
              value={getFieldValue("email")}
              onChange={(e) => onFieldChange("email", e.target.value)}
              className="mt-1" />

          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Phone</Label>
            <div className="relative mt-1">
              <Input
                value={getFieldValue("phone")}
                onChange={(e) => onFieldChange("phone", e.target.value)}
                className="pr-10" />

              {getFieldValue("phone") &&
              <button
                onClick={() => onCallClick?.()}
                title="Log Call"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800 transition-colors">

                  
                </button>
              }
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">City</Label>
            <Input
              value={getFieldValue("city")}
              onChange={(e) => onFieldChange("city", e.target.value)}
              className="mt-1" />

          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Language</Label>
            <Select
              value={languageSelectValue}
              onValueChange={(v) => {
                if (v === "__custom__") {
                  setShowCustomLanguage(true);
                  onFieldChange("language_id", "");
                } else {
                  setShowCustomLanguage(false);
                  onFieldChange("language_id", v);
                }
              }}>

              <SelectTrigger className="mt-1"><SelectValue placeholder="Select language..." /></SelectTrigger>
              <SelectContent>
                {languages.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                <SelectItem value="__custom__">Other (type below)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Status</Label>
            <Select value={currentStatus} onValueChange={(value) => onFieldChange("status_id", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select status..." />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => <SelectItem key={status.id} value={status.id}>{status.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Source</Label>
            <Select
              value={sourceSelectValue}
              onValueChange={(v) => {
                if (v === "__custom__") {
                  setShowCustomSource(true);
                  onFieldChange("source_id", "");
                } else {
                  setShowCustomSource(false);
                  onFieldChange("source_id", v);
                }
              }}>

              <SelectTrigger className="mt-1"><SelectValue placeholder="Select source..." /></SelectTrigger>
              <SelectContent>
                {sources.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                <SelectItem value="__custom__">Other (type below)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Notes & Feedback</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Description</Label>
            <Textarea
              value={getFieldValue("description")}
              onChange={(e) => onFieldChange("description", e.target.value)}
              className="mt-1 min-h-24" />

          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Client Feedback</Label>
            <Textarea
              value={getFieldValue("client_feedback")}
              onChange={(e) => onFieldChange("client_feedback", e.target.value)}
              className="mt-1 min-h-24" />

          </div>
        </div>
      </div>

    </div>);

}