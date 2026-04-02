import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Trash2, Copy, Pencil, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ManageTemplatesDialog({ open, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const load = async () => {
    const list = await base44.entities.ImportTemplate.list();
    setTemplates(list);
  };

  useEffect(() => { if (open) load(); }, [open]);

  const handleDelete = async (id) => {
    await base44.entities.ImportTemplate.delete(id);
    load();
  };

  const handleDuplicate = async (t) => {
    await base44.entities.ImportTemplate.create({
      name: t.name + " (Copy)",
      mapping: t.mapping,
      defaults: t.defaults || {},
      round_robin_enabled: t.round_robin_enabled || false,
    });
    load();
  };

  const handleRenameStart = (t) => {
    setEditingId(t.id);
    setEditName(t.name);
  };

  const handleRenameSave = async (id) => {
    await base44.entities.ImportTemplate.update(id, { name: editName });
    setEditingId(null);
    load();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Import Templates</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-4">
          {templates.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No templates saved yet.</p>
          )}
          {templates.map(t => (
            <div key={t.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              {editingId === t.id ? (
                <Input
                  className="h-7 text-sm flex-1"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  autoFocus
                />
              ) : (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{t.name}</p>
                  <p className="text-xs text-gray-500">
                    {Object.keys(t.mapping || {}).length} columns mapped
                    {t.round_robin_enabled ? " · Round Robin ON" : ""}
                  </p>
                </div>
              )}
              <div className="flex gap-1">
                {editingId === t.id ? (
                  <>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleRenameSave(t.id)}>
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleRenameStart(t)}>
                      <Pencil className="w-3.5 h-3.5 text-gray-500" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDuplicate(t)}>
                      <Copy className="w-3.5 h-3.5 text-gray-500" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(t.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}