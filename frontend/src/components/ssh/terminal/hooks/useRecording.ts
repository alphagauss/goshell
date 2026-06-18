import { useEffect, useMemo, useRef, useState } from "react";

export interface RecordingEntry {
  type: "command" | "input" | "output";
  data: string;
  timestamp: number;
}

function formatTimestamp(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  return `${hours}:${String(minutes % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}.${String(ms % 1000).padStart(3, "0")}`;
}

function buildContent(sessionID: string, startTime: number, entries: RecordingEntry[]) {
  const lines = entries.map((entry) => {
    const time = formatTimestamp(entry.timestamp);
    if (entry.type === "command") {
      return `[${time}] $ ${entry.data}`;
    }
    if (entry.type === "input") {
      return `[${time}] > ${entry.data}`;
    }
    return `[${time}] ${entry.data}`;
  });

  return [
    `Session Recording`,
    `Session: ${sessionID}`,
    `Start: ${new Date(startTime).toLocaleString()}`,
    `Entries: ${entries.length}`,
    "---",
    ...lines,
  ].join("\n");
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function useRecording(sessionID: string) {
  const [isRecording, setIsRecording] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [duration, setDuration] = useState(0);
  const [entries, setEntries] = useState<RecordingEntry[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const entriesRef = useRef<RecordingEntry[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  const formattedDuration = useMemo(() => {
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    }
    return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
  }, [duration]);

  function startRecording() {
    if (isRecording) {
      return;
    }

    const startedAt = Date.now();
    startTimeRef.current = startedAt;
    setStartTime(startedAt);
    setEntries([]);
    entriesRef.current = [];
    setDuration(0);
    setIsRecording(true);
    timerRef.current = window.setInterval(() => {
      if (startTimeRef.current) {
        setDuration(Date.now() - startTimeRef.current);
      }
    }, 1000);
  }

  function saveRecording(snapshot = entriesRef.current) {
    if (!startTimeRef.current || snapshot.length === 0) {
      return;
    }

    const filename = `terminal-recording-${sessionID}-${Date.now()}.txt`;
    downloadText(filename, buildContent(sessionID, startTimeRef.current, snapshot));
  }

  function stopRecording() {
    if (!isRecording) {
      return entriesRef.current;
    }

    setIsRecording(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const snapshot = entriesRef.current.slice();
    saveRecording(snapshot);
    return snapshot;
  }

  function toggleRecording() {
    if (isRecording) {
      return stopRecording();
    }

    startRecording();
    return [];
  }

  function recordEntry(type: RecordingEntry["type"], data: string) {
    if (!isRecording || !data) {
      return;
    }

    const entry: RecordingEntry = {
      type,
      data,
      timestamp: startTimeRef.current ? Date.now() - startTimeRef.current : 0,
    };
    entriesRef.current = [...entriesRef.current, entry];
    setEntries(entriesRef.current);
  }

  function recordInput(data: string) {
    recordEntry("input", data);
  }

  function recordOutput(data: string) {
    recordEntry("output", data);
  }

  function recordCommand(data: string) {
    recordEntry("command", data);
  }

  function clearRecording() {
    setEntries([]);
    entriesRef.current = [];
    startTimeRef.current = null;
    setStartTime(null);
    setDuration(0);
    setIsRecording(false);
  }

  return {
    isRecording,
    startTime,
    duration,
    entries,
    formattedDuration,
    startRecording,
    stopRecording,
    toggleRecording,
    recordInput,
    recordOutput,
    recordCommand,
    saveRecording,
    clearRecording,
  };
}
