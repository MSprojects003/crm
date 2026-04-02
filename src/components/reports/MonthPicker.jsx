import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, subMonths, addMonths } from "date-fns";

export default function MonthPicker({ value, onChange }) {
  const label = format(value, "MMMM yyyy");

  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
      <button
        className="text-gray-400 hover:text-gray-700 p-0.5"
        onClick={() => onChange(subMonths(value, 1))}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm font-semibold text-gray-700 w-32 text-center">{label}</span>
      <button
        className="text-gray-400 hover:text-gray-700 p-0.5"
        onClick={() => onChange(addMonths(value, 1))}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}