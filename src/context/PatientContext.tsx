import React, { createContext, useContext, useState, useEffect } from "react";
import { useData } from "@/hooks/useData";

interface Profile {
  id: string;
  name: string;
  relationship: string;
}

interface PatientContextType {
  activeProfileId: string | null;
  setActiveProfileId: (id: string) => void;
  activeProfile: Profile | null;
  profiles: Profile[];
  refreshProfiles: () => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const { data: profiles, refresh: refreshProfiles } = useData<Profile[]>("/api/profiles");
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (profiles && profiles.length > 0 && !activeProfileId) {
      // Set the first profile as active by default
      setActiveProfileId(profiles[0].id);
    }
  }, [profiles, activeProfileId]);

  const activeProfile = profiles?.find(p => p.id === activeProfileId) || null;

  return (
    <PatientContext.Provider value={{ 
      activeProfileId, 
      setActiveProfileId, 
      activeProfile, 
      profiles: profiles || [],
      refreshProfiles
    }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error("usePatient must be used within a PatientProvider");
  }
  return context;
}
