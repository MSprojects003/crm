import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function useLeadConfig() {
  const [configs, setConfigs] = useState({
    statuses: [],
    sources: [],
    temperatures: ["Hot", "Warm", "Cold"],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const allConfigs = await base44.entities.LeadConfig.list("-created_date", 50).catch(() => []);
      
      const configMap = {};
      allConfigs.forEach(config => {
        try {
          configMap[config.config_key] = JSON.parse(config.config_value);
        } catch {
          configMap[config.config_key] = config.config_value;
        }
      });

      setConfigs(prev => ({
        ...prev,
        statuses: configMap.statuses || prev.statuses || [],
        sources: configMap.sources || prev.sources || [],
        temperatures: configMap.temperatures || prev.temperatures || ["Hot", "Warm", "Cold"],
      }));
    } catch (err) {
      console.error("Failed to load lead config:", err);
    } finally {
      setLoading(false);
    }
  };

  return { configs, loading, refetch: loadConfigs };
}