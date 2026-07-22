"use client";

import { useEffect, useState } from "react";
import { getSettings } from "@/lib/storage";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const [preset, setPreset] = useState("");

  useEffect(() => {
    (async () => {
      const settings = await getSettings();
      const p = settings?.displayPreset || "desktop";
      setPreset(p);
      document.documentElement.setAttribute("data-preset", p);
    })();
  }, []);

  useEffect(() => {
    if (!preset) return;
    const interval = setInterval(async () => {
      const settings = await getSettings();
      const p = settings?.displayPreset || "desktop";
      if (p !== preset) {
        setPreset(p);
        document.documentElement.setAttribute("data-preset", p);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [preset]);

  return <>{children}</>;
}
