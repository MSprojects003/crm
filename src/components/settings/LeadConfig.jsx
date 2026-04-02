import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, ListChecks, Plus, X, Languages } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

function ConfigManager({ title, icon: Icon, color, entityName, fields }) {
  const [items, setItems] = useState([]);
  const [input, setInput] = useState("");
  const [colorInput, setColorInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await base44.entities[entityName].list();
      setItems(data.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    } catch (error) {
      console.error(`Failed to fetch ${entityName}:`, error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [entityName]);

  const add = async () => {
    const val = input.trim();
    if (!val) return;

    try {
      const newItem = { name: val, is_active: true };
      if (entityName === "LeadStatus") {
        newItem.color = colorInput || "#3b82f6";
        newItem.sort_order = items.length;
      }
      await base44.entities[entityName].create(newItem);
      setInput("");
      setColorInput("");
      fetchItems();
    } catch (error) {
      console.error(`Failed to create ${entityName}:`, error);
    }
  };

  const toggleActive = async (id, isActive) => {
    try {
      await base44.entities[entityName].update(id, { is_active: !isActive });
      fetchItems();
    } catch (error) {
      console.error(`Failed to update ${entityName}:`, error);
    }
  };

  const remove = async (id) => {
    try {
      await base44.entities[entityName].delete(id);
      setDeleteId(null);
      fetchItems();
    } catch (error) {
      console.error(`Failed to delete ${entityName}:`, error);
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 text-base text-${color}-700`}>
          <Icon className={`w-4 h-4 text-${color}-500`} /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {items.length > 0 && (
            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2 min-w-0">
                    {entityName === "LeadStatus" && (
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color || "#3b82f6" }}
                      />
                    )}
                    <div className="min-w-0">
                      <span className="text-sm font-medium">{item.name}</span>
                      <div className="text-xs text-gray-400 font-mono truncate" title={item.id}>ID: {item.id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.is_active ? "default" : "outline"}>
                      {item.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <button
                      onClick={() => toggleActive(item.id, item.is_active)}
                      className="text-xs px-2 py-1 rounded hover:bg-gray-200"
                    >
                      {item.is_active ? "Disable" : "Enable"}
                    </button>
                    <AlertDialog open={deleteId === item.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                      <AlertDialogTrigger asChild>
                        <button
                          onClick={() => setDeleteId(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogTitle>Delete {title}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{item.name}". This action cannot be undone.
                        </AlertDialogDescription>
                        <div className="flex gap-2 justify-end">
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove(item.id)} className="bg-red-600">
                            Delete
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Add new..."
              className="h-8 text-sm flex-1"
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
            {entityName === "LeadStatus" && (
              <Input
                type="color"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                className="h-8 w-12"
              />
            )}
            <Button size="sm" variant="outline" onClick={add} className="h-8 px-2">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LeadConfig() {
  return (
    <div className="space-y-4">
      <ConfigManager title="Lead Statuses" icon={ListChecks} color="blue" entityName="LeadStatus" />
      <ConfigManager title="Lead Sources" icon={Globe} color="green" entityName="LeadSource" />
      <ConfigManager title="Languages" icon={Languages} color="indigo" entityName="LeadLanguage" />
    </div>
  );
}