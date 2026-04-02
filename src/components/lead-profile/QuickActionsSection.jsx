import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MessageSquare, Phone, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function QuickActionsSection({ lead, user, onActivityAdded, onReminderAdded, onCallClick }) {
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Note state
  const [noteContent, setNoteContent] = useState('');

  // Reminder state
  const [reminderDateTime, setReminderDateTime] = useState('');
  const [reminderNotes, setReminderNotes] = useState('');



  const [error, setError] = useState('');

  const handleAddNote = async () => {
    if (!noteContent.trim()) {
      setError('Please enter a note');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await base44.functions.invoke('createLeadNote', {
        leadId: lead.id,
        content: noteContent
      });
      toast.success('Note added successfully');
      setNoteContent('');
      setNoteDialogOpen(false);
      onActivityAdded?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add note');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReminder = async () => {
    if (!reminderDateTime) {
      setError('Please select a date and time');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await base44.functions.invoke('createFollowUpReminder', {
        leadId: lead.id,
        dueDateTime: reminderDateTime,
        notes: reminderNotes
      });
      toast.success('Follow-up reminder created');
      setReminderDateTime('');
      setReminderNotes('');
      setReminderDialogOpen(false);
      onReminderAdded?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create reminder');
    } finally {
      setLoading(false);
    }
  };



  return (
    <>
      {/* Quick Actions Bar */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-1">Quick Actions</span>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-green-700 border-green-300 hover:bg-green-50"
            onClick={() => onCallClick?.()}>
            <Phone className="w-3.5 h-3.5" /> Call
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5"
            onClick={() => { setNoteDialogOpen(true); setError(''); }}>
            <MessageSquare className="w-3.5 h-3.5" /> Add Note
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5"
            onClick={() => { setReminderDialogOpen(true); setError(''); }}>
            <Calendar className="w-3.5 h-3.5" /> Follow-Up
          </Button>
        </div>
      </div>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <Textarea
              placeholder="Enter your note..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="resize-none"
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setNoteDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddNote}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Reminder Dialog */}
      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Follow-Up Call</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Date & Time</label>
              <Input
                type="datetime-local"
                value={reminderDateTime}
                onChange={(e) => setReminderDateTime(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Notes (Optional)</label>
              <Textarea
                placeholder="Any notes for this follow-up..."
                value={reminderNotes}
                onChange={(e) => setReminderNotes(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setReminderDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddReminder}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Schedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


    </>
  );
}