import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from "@/api/base44Client";
import { Download } from "lucide-react";

export default function ImportDetailsModal({ session, open, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && session?.import_id) {
      loadLogs();
    }
  }, [open, session?.import_id]);

  const loadLogs = async () => {
    try {
      const data = await base44.entities.ImportLog.filter({ import_id: session.import_id });
      setLogs(data);
    } catch (err) {
      console.error("Failed to load logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const invalidLogs = logs.filter(l => l.type === "invalid");
  const duplicateLogs = logs.filter(l => l.type === "duplicate");
  const blankLogs = logs.filter(l => l.type === "blank");

  const downloadCSV = (data, columns, filename) => {
    const csv = [
      columns.join(","),
      ...data.map(row => columns.map(col => `"${(row[col] || "").toString().replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Details: {session.import_id}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading logs...</div>
        ) : (
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="invalid">Invalid ({invalidLogs.length})</TabsTrigger>
              <TabsTrigger value="duplicates">Duplicates ({duplicateLogs.length})</TabsTrigger>
              <TabsTrigger value="blank">Blank ({blankLogs.length})</TabsTrigger>
            </TabsList>

            {/* Summary Tab */}
            <TabsContent value="summary" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Total Rows</p>
                  <p className="text-2xl font-bold text-gray-900">{session.total_rows}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Created</p>
                  <p className="text-2xl font-bold text-green-600">{session.created_count}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Updated</p>
                  <p className="text-2xl font-bold text-blue-600">{session.updated_count}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Duplicates</p>
                  <p className="text-2xl font-bold text-orange-600">{session.duplicate_count}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Invalid</p>
                  <p className="text-2xl font-bold text-red-600">{session.invalid_count}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Blank</p>
                  <p className="text-2xl font-bold text-yellow-600">{session.blank_count}</p>
                </div>
              </div>
              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Source:</span><span className="font-medium">{session.source || "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Assignment Mode:</span><span className="font-medium">{session.assignment_mode || "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Template:</span><span className="font-medium">{session.template_name || "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Status:</span><span className="font-medium">{session.status}</span></div>
              </div>
              {session.errors && session.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-red-900 mb-2">Errors:</p>
                  <div className="space-y-1">
                    {session.errors.map((err, idx) => (
                      <p key={idx} className="text-xs text-red-800">• {err}</p>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Invalid Tab */}
            <TabsContent value="invalid" className="space-y-4">
              {invalidLogs.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No invalid rows</p>
              ) : (
                <>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">Row</th>
                          <th className="px-3 py-2 text-left font-semibold">Name</th>
                          <th className="px-3 py-2 text-left font-semibold">Phone</th>
                          <th className="px-3 py-2 text-left font-semibold">Email</th>
                          <th className="px-3 py-2 text-left font-semibold">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invalidLogs.map((log, idx) => (
                          <tr key={log.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-3 py-2">{log.row_number}</td>
                            <td className="px-3 py-2">{log.first_name} {log.last_name}</td>
                            <td className="px-3 py-2 font-mono text-xs">{log.original_phone}</td>
                            <td className="px-3 py-2 text-xs">{log.email || "—"}</td>
                            <td className="px-3 py-2 text-xs text-red-600">{log.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadCSV(invalidLogs, ["first_name", "last_name", "original_phone", "email", "reason"], "invalid_rows.csv")}
                    className="gap-1"
                  >
                    <Download className="w-4 h-4" /> Download CSV
                  </Button>
                </>
              )}
            </TabsContent>

            {/* Duplicates Tab */}
            <TabsContent value="duplicates" className="space-y-4">
              {duplicateLogs.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No duplicates</p>
              ) : (
                <>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">Name</th>
                          <th className="px-3 py-2 text-left font-semibold">Phone</th>
                          <th className="px-3 py-2 text-left font-semibold">Existing Owner</th>
                          <th className="px-3 py-2 text-left font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {duplicateLogs.map((log, idx) => (
                          <tr key={log.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-3 py-2">{log.first_name} {log.last_name}</td>
                            <td className="px-3 py-2 font-mono text-xs">{log.phone}</td>
                            <td className="px-3 py-2 text-xs">{log.existing_owner || "—"}</td>
                            <td className="px-3 py-2 text-xs text-orange-600">{log.action_taken || "Skipped"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadCSV(duplicateLogs, ["first_name", "last_name", "phone", "existing_owner", "action_taken"], "duplicate_rows.csv")}
                    className="gap-1"
                  >
                    <Download className="w-4 h-4" /> Download CSV
                  </Button>
                </>
              )}
            </TabsContent>

            {/* Blank Tab */}
            <TabsContent value="blank" className="space-y-4">
              {blankLogs.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No blank phone numbers</p>
              ) : (
                <>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">Row</th>
                          <th className="px-3 py-2 text-left font-semibold">Name</th>
                          <th className="px-3 py-2 text-left font-semibold">Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blankLogs.map((log, idx) => (
                          <tr key={log.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-3 py-2">{log.row_number}</td>
                            <td className="px-3 py-2">{log.first_name} {log.last_name}</td>
                            <td className="px-3 py-2 text-xs">{log.email || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadCSV(blankLogs, ["first_name", "last_name", "email"], "blank_rows.csv")}
                    className="gap-1"
                  >
                    <Download className="w-4 h-4" /> Download CSV
                  </Button>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button onClick={onClose} variant="outline">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}