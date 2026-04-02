import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";

export default function MentionTextarea({ value, onChange, users = [], placeholder, rows = 3, className = "" }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionStart, setMentionStart] = useState(-1);
  const textareaRef = useRef(null);

  const handleChange = (e) => {
    const text = e.target.value;
    const cursor = e.target.selectionStart;
    onChange(text);

    const textBeforeCursor = text.substring(0, cursor);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (atIndex !== -1) {
      const afterAt = textBeforeCursor.substring(atIndex + 1);
      if (!afterAt.includes(" ") && !afterAt.includes("\n")) {
        setMentionStart(atIndex);
        setMentionSearch(afterAt.toLowerCase());
        setShowDropdown(true);
        return;
      }
    }
    setShowDropdown(false);
  };

  const selectUser = (user) => {
    const cursorPos = textareaRef.current?.selectionStart ?? value.length;
    const before = value.substring(0, mentionStart);
    const after = value.substring(cursorPos);
    const newText = before + "@" + user.full_name + " " + after;
    onChange(newText);
    setShowDropdown(false);
    setTimeout(() => {
      if (textareaRef.current) {
        const pos = mentionStart + user.full_name.length + 2;
        textareaRef.current.setSelectionRange(pos, pos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const filteredUsers = users
    .filter(u => u.full_name?.toLowerCase().includes(mentionSearch) || u.email?.toLowerCase().includes(mentionSearch))
    .slice(0, 6);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        placeholder={placeholder}
        rows={rows}
        className={`text-sm resize-none ${className}`}
      />
      {showDropdown && filteredUsers.length > 0 && (
        <div className="absolute z-20 bottom-full mb-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg w-56 overflow-hidden">
          <p className="text-xs text-gray-400 px-3 pt-2 pb-1">Mention a user</p>
          {filteredUsers.map(u => (
            <button
              key={u.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); selectUser(u); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-blue-50 text-left transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0 font-semibold">
                {u.full_name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <span className="truncate text-gray-800">{u.full_name || u.email}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}