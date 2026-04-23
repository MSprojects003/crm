import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Download, Eye, Trash2 } from "lucide-react";
import { useAuth } from '@/lib/AuthContext';
import ImportDetailsModal from "@/components/imports/ImportDetailsModal";

export default function ImportHistory() {
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadSessions();
  }, [user?.id]);

  const loadSessions = async () => {
    try {
      const data = await base44.entities.ImportSession.list("-created_date", 100);
      setSessions(data);
    } catch (err) {
      console.error("Failed to load import sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (session) => {
    setSelectedSession(session);
    setShowDetails(true);
  };

  const handleDelete = async (sessionId) => {
    if (!window.confirm("Delete this import history and all logs?")) return;
    try {
      await base44.entities.ImportSession.delete(sessionId);
      const logs = await base44.entities.ImportLog.filter({ import_id: sessionId });
      await Promise.all(logs.map(log => base44.entities.ImportLog.delete(log.id)));
      setSessions(s => s.filter(x => x.id !== sessionId));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString();
  };

  const getStatusBadge = (status) => {
    const colors = {
      "Success": "bg-green-100 text-green-800",
      "Partial": "bg-yellow-100 text-yellow-800",
      "Failed": "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (authLoading || loading) return <div className="text-center py-8 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import History</h1>
        <p className="text-sm text-gray-500 mt-1">{sessions.length} imports</p>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No import history yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">User</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Created</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Updated</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Invalid</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Duplicates</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Source</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session, idx) => (
                  <tr key={session.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 text-sm text-gray-800">{formatDate(session.import_timestamp || session.created_date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{session.user_id}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-800 font-medium">{session.total_rows}</td>
                    <td className="px-4 py-3 text-sm text-center text-green-600 font-medium">{session.created_count}</td>
                    <td className="px-4 py-3 text-sm text-center text-blue-600 font-medium">{session.updated_count}</td>
                    <td className="px-4 py-3 text-sm text-center text-red-600 font-medium">{session.invalid_count}</td>
                    <td className="px-4 py-3 text-sm text-center text-orange-600 font-medium">{session.duplicate_count}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{session.source || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusBadge(session.status)}`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewDetails(session)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(session.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedSession && (
        <ImportDetailsModal
          session={selectedSession}
          open={showDetails}
          onClose={() => { setShowDetails(false); setSelectedSession(null); }}
        />
      )}
    </div>
  );
}