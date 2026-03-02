// src/hooks/useTutorial.js
import { useState, useCallback } from "react";

const PREFIX = "ag:tutorial:";

export default function useTutorial(key) {
  const storageKey = PREFIX + key;
  const [run, setRun] = useState(() => {
    try {
      return !localStorage.getItem(storageKey);
    } catch {
      return false;
    }
  });

  const handleFinish = useCallback((data) => {
    const { status } = data;
    if (status === "finished" || status === "skipped") {
      setRun(false);
      try {
        localStorage.setItem(storageKey, "1");
      } catch {}
    }
  }, [storageKey]);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setRun(true);
  }, [storageKey]);

  return { run, handleFinish, reset };
}
