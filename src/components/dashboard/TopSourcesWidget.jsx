import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function TopSourcesWidget({ leads }) {
  const sourceData = leads.reduce((acc, lead) => {
    const source = lead.source || "Unknown";
    const existing = acc.find(s => s.name === source);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ name: source, count: 1 });
    }
    return acc;
  }, []).sort((a, b) => b.count - a.count).slice(0, 6);

  return (
    <Card className="p-4 border-gray-200 bg-white">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Lead Sources</h3>
      {sourceData.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={sourceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb" }} />
            <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm text-gray-500 py-8">No lead data available</p>
      )}
    </Card>
  );
}