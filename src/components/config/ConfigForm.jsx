import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function ConfigForm({ config, open, onClose, onSave }) {
  const [key, setKey] = useState(config?.config_key || "");
  const [value, setValue] = useState(config?.config_value || "");
  const [description, setDescription] = useState(config?.description || "");
  const [error, setError] = useState("");

  const handleSave = () => {
    setError("");
    if (!key.trim()) {
      setError("Config key is required");
      return;
    }
    if (!value.trim()) {
      setError("Config value is required");
      return;
    }

    // Validate JSON if it looks like JSON
    if (value.trim().startsWith("[") || value.trim().startsWith("{")) {
      try {
        JSON.parse(value);
      } catch (e) {
        setError("Invalid JSON format");
        return;
      }
    }

    onSave({
      id: config?.id,
      config_key: key,
      config_value: value,
      description,
    });

    setKey("");
    setValue("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{config?.id ? "Edit Configuration" : "Add Configuration"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-xs mb-1 block">Config Key *</Label>
            <Input
              placeholder="e.g., stages, sources, roundRobin"
              value={key}
              onChange={e => setKey(e.target.value)}
              disabled={!!config?.id}
              className="text-sm"
            />
          </div>

          <div>
            <Label className="text-xs mb-1 block">Config Value (JSON or plain text) *</Label>
            <Textarea
              placeholder='["value1", "value2"] or {"key": "value"}'
              value={value}
              onChange={e => setValue(e.target.value)}
              className="font-mono text-xs h-32"
            />
          </div>

          <div>
            <Label className="text-xs mb-1 block">Description</Label>
            <Textarea
              placeholder="What is this configuration used for?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="text-xs h-20"
            />
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700">{error}</div>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            {config?.id ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}