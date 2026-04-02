import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

const ACCOUNT_TYPES = ["Standard", "Premium", "VIP", "Demo"];

export default function LeadTradingAccountSection({ lead, changes, onFieldChange }) {
  const [showPassword, setShowPassword] = useState(false);

  const getFieldValue = (field) => changes[field] !== undefined ? changes[field] : (lead[field] || "");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <Label className="text-sm font-medium text-gray-700">Account Equity</Label>
          <Input
            type="number"
            step="0.01"
            value={getFieldValue("acc_equity")}
            onChange={(e) => onFieldChange("acc_equity", parseFloat(e.target.value) || 0)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700">Account Balance</Label>
          <Input
            type="number"
            step="0.01"
            value={getFieldValue("acc_balance")}
            onChange={(e) => onFieldChange("acc_balance", parseFloat(e.target.value) || 0)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700">Account Number</Label>
          <Input
            value={getFieldValue("acc_number")}
            onChange={(e) => onFieldChange("acc_number", e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700">Account Name</Label>
          <Input
            value={getFieldValue("acc_name")}
            onChange={(e) => onFieldChange("acc_name", e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700">Account Type</Label>
          <Select value={getFieldValue("acc_type")} onValueChange={(value) => onFieldChange("acc_type", value)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACCOUNT_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700">Account Server</Label>
          <Input
            value={getFieldValue("acc_server")}
            onChange={(e) => onFieldChange("acc_server", e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700">Investor Password</Label>
          <div className="flex gap-2 mt-1">
            <Input
              type={showPassword ? "text" : "password"}
              value={getFieldValue("investor_password")}
              onChange={(e) => onFieldChange("investor_password", e.target.value)}
            />
            <Button
              onClick={() => setShowPassword(!showPassword)}
              variant="outline"
              size="icon"
              className="h-10"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}