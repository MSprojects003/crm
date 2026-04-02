import { Button } from "@/components/ui/button";
import { Phone, ChevronRight, MessageCircle, Loader2 } from "lucide-react";

export default function ActionBar({
  lead,
  onClickToCall,
  onShowNextCaller,
  nextCallerLoading,
  onLogCall,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex items-center gap-3 flex-wrap">
      <Button
        onClick={onClickToCall}
        disabled={!lead?.phone}
        variant="outline"
        className="gap-2"
      >
        <Phone className="w-4 h-4" />
        Click To Call
      </Button>

      <Button
        onClick={onLogCall}
        variant="outline"
        className="gap-2"
      >
        <MessageCircle className="w-4 h-4" />
        WhatsApp Call Log
      </Button>

      <Button
        onClick={onShowNextCaller}
        disabled={nextCallerLoading}
        variant="outline"
        className="gap-2"
      >
        {nextCallerLoading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <ChevronRight className="w-4 h-4" />}
        Show Next Caller
      </Button>
    </div>
  );
}