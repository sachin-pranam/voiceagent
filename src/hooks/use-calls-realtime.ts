import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Refreshes call-related queries when the calls table changes. */
export function useCallsRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    
    console.log("Setting up real-time subscription for calls table");
    
    const channel = supabase
      .channel("calls-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "calls" }, (payload) => {
        console.log("Real-time change detected:", payload);
        clearTimeout(timer);
        timer = setTimeout(() => {
          console.log("Refreshing call queries due to real-time change");
          qc.invalidateQueries({ queryKey: ["calls"] });
          qc.invalidateQueries({ queryKey: ["call-stats"] });
          qc.invalidateQueries({ queryKey: ["call"] });
        }, 200); // Reduced from 800ms to 200ms for faster updates
      })
      .subscribe((status) => {
        console.log("Real-time subscription status:", status);
      });
      
    return () => {
      console.log("Cleaning up real-time subscription");
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [qc]);
}
