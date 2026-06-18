import { useEffect, useRef, useState } from "react";
import { eventPayload, eventsApi, sshApi } from "@/lib/wails";
import type { RemoteSearchHit } from "@/components/ssh/file-manager/types";

function createSearchID() {
  return `search-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useRemoteSearch(connID: string) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RemoteSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [searchID, setSearchID] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const searchIDRef = useRef("");

  useEffect(() => {
    const startUnsubscribe = eventsApi.on<{ searchID?: string }>("search-start", (event) => {
      const payload = eventPayload(event);
      if (payload.searchID !== searchIDRef.current) {
        return;
      }

      setSearching(true);
      setError("");
    });

    const resultUnsubscribe = eventsApi.on<RemoteSearchHit>("search-result", (event) => {
      const payload = eventPayload(event);
      if (payload.searchID !== searchIDRef.current) {
        return;
      }

      setResults((current) => [...current, payload]);
    });

    const completeUnsubscribe = eventsApi.on<{ searchID?: string; totalFound?: number; error?: boolean }>(
      "search-complete",
      (event) => {
        const payload = eventPayload(event);
        if (payload.searchID !== searchIDRef.current) {
          return;
        }

        setSearching(false);
      },
    );

    return () => {
      startUnsubscribe();
      resultUnsubscribe();
      completeUnsubscribe();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (searchIDRef.current) {
        void sshApi.cancelSearch(connID, searchIDRef.current).catch(() => undefined);
      }
    };
  }, [connID]);

  async function search(keyword: string, basePath: string) {
    const trimmed = keyword.trim();
    setQuery(trimmed);
    setSubmittedQuery(trimmed);
    setResults([]);
    setError("");

    if (!trimmed) {
      searchIDRef.current = "";
      setSearchID("");
      setSearching(false);
      return;
    }

    const searchID = createSearchID();
    searchIDRef.current = searchID;
    setSearchID(searchID);
    setSearching(true);

    try {
      await sshApi.searchFiles(connID, basePath, trimmed, searchID);
    } catch (err) {
      if (searchIDRef.current !== searchID) {
        return;
      }

      setSearching(false);
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function cancel() {
    const searchID = searchIDRef.current;
    if (!searchID) {
      return;
    }

    searchIDRef.current = "";
    setSearchID("");
    setSearching(false);
    await sshApi.cancelSearch(connID, searchID).catch(() => undefined);
  }

  function reset() {
    searchIDRef.current = "";
    setSearchID("");
    setSubmittedQuery("");
    setQuery("");
    setResults([]);
    setSearching(false);
    setError("");
  }

  return {
    query,
    setQuery,
    results,
    searching,
    error,
    search,
    cancel,
    reset,
    searchID,
    submittedQuery,
  };
}
