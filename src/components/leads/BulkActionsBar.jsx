import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Users, Tag, Trash2, X, Globe } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

export default function BulkActionsBar({ count, users, statuses, sources, onAssign, onChangeStatus, onChangeSource, onDelete, onClear }) {
  const [pending, setPending] = useState(null);

  const confirm = (action, value, label) => setPending({ action, value, label });

  const handleConfirm = () => {
    if (!pending) return;
    const { action, value } = pending;
    if (action === "assign") onAssign(value);
    else if (action === "status") onChangeStatus(value);
    else if (action === "source") onChangeSource(value);
    else if (action === "delete") onDelete();
    setPending(null);
  };

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-blue-700">{count} selected</span>

        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" />
          <Select onValueChange={(v) => confirm("assign", v, `Assign ${count} lead(s) to the selected agent?`)}>
            <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Assign to..." /></SelectTrigger>
            <SelectContent>
              {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-blue-500" />
          <Select onValueChange={(v) => confirm("status", v, `Update status for ${count} lead(s)?`)}>
            <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Change status..." /></SelectTrigger>
            <SelectContent>
              {(statuses || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-500" />
          <Select onValueChange={(v) => confirm("source", v, `Update source for ${count} lead(s)?`)}>
            <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Change source..." /></SelectTrigger>
            <SelectContent>
              {(sources || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => confirm("delete", null, `Permanently delete ${count} lead(s)?`)}
          className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 mr-1" /> Delete
        </Button>

        <Button variant="ghost" size="sm" onClick={onClear} className="h-8 text-gray-500 ml-auto">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <AlertDialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.label} This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={pending?.action === "delete" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}