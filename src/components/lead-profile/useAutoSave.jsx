import { useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";

export function useAutoSave(leadId) {
  const timeoutRef = useRef({});

  const autoSave = useCallback(
    async (field, value, onStatusChange) => {
      // Clear any pending timeout for this field
      if (timeoutRef.current[field]) {
        clearTimeout(timeoutRef.current[field]);
      }

      // Show saving status
      if (onStatusChange) onStatusChange(field, "saving");

      // Debounce with 500ms delay
      timeoutRef.current[field] = setTimeout(async () => {
        try {
          await base44.entities.Lead.update(leadId, { [field]: value });
          if (onStatusChange) onStatusChange(field, "saved");

          // Clear saved indicator after 2 seconds
          setTimeout(() => {
            if (onStatusChange) onStatusChange(field, null);
          }, 2000);
        } catch (error) {
          console.error(`Failed to save ${field}:`, error);
          if (onStatusChange) onStatusChange(field, "error");
        }
      }, 500);
    },
    [leadId]
  );

  const cancelPending = useCallback(() => {
    Object.values(timeoutRef.current).forEach(clearTimeout);
    timeoutRef.current = {};
  }, []);

  return { autoSave, cancelPending };
}