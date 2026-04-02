import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneOff, Save, Mic, MicOff } from "lucide-react";

const TEMP_COLORS = { Hot: "bg-red-100 text-red-700", Warm: "bg-orange-100 text-orange-700", Cold: "bg-blue-100 text-blue-700" };

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function LiveCallScreen({ lead, user, onEndCall, onClose }) {
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState("");
  const [muted, setMuted] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const notesRef = useRef(notes);
  const startTime = useRef(Date.now());

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-save notes every 5 seconds
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (notesRef.current) {
        setLastSaved(new Date());
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleEndCall = () => {
    onEndCall({ notes, duration: elapsed });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Top bar - active call */}
        <div className="bg-green-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <span className="text-white font-semibold">Live Call</span>
          </div>
          <span className="text-white text-2xl font-mono font-bold tracking-widest">
            {formatTime(elapsed)}
          </span>
        </div>

        {/* Lead info */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {lead.first_name} {lead.last_name}
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">{lead.phone}</p>
            {lead.email && <p className="text-gray-400 text-xs mt-0.5">{lead.email}</p>}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {lead.temperature && (
              <Badge className={`${TEMP_COLORS[lead.temperature]} border-0 text-xs`}>
                {lead.temperature}
              </Badge>
            )}
            {lead.status && (
              <Badge variant="outline" className="text-xs">{lead.status}</Badge>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-gray-700">Call Notes</label>
            {lastSaved && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Save className="w-3 h-3" /> Auto-saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Type notes during the call..."
            className="h-32 resize-none text-sm"
          />
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className={`gap-2 ${muted ? "border-red-300 text-red-600" : ""}`}
            onClick={() => setMuted(m => !m)}
          >
            {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {muted ? "Unmute" : "Mute"}
          </Button>
          <div className="flex-1" />
          <Button
            onClick={handleEndCall}
            className="bg-red-600 hover:bg-red-700 text-white gap-2 flex-1"
            size="lg"
          >
            <PhoneOff className="w-5 h-5" /> End Call
          </Button>
        </div>
      </div>
    </div>
  );
}