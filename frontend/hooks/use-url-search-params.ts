"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

type ParamValue = string | number | boolean | undefined;
type Params = Record<string, ParamValue>;
type Types = Record<string, any>;

function serializeValue(value: ParamValue): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function deserializeValue(raw: string | null, type: any, defaultVal: any): any {
  if (raw === null || raw === undefined) return defaultVal;
  if (type === Number) return Number(raw);
  if (type === Boolean) return raw === "true";
  return raw;
}

function readParams(initial: Params, types: Types): Params {
  const search = new URLSearchParams(window.location.search);
  const result: Params = { ...initial };
  for (const key of Object.keys(initial)) {
    const raw = search.get(key);
    if (raw !== null) {
      result[key] = deserializeValue(raw, types[key], initial[key]);
    }
  }
  return result;
}

function writeParams(next: Params, initial: Params): void {
  const url = new URL(window.location.href);

  for (const [key, value] of Object.entries(next)) {
    const serialized = serializeValue(value);
    const defaultVal = serializeValue(initial[key]);

    if (serialized === null || serialized === defaultVal) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, serialized);
    }
  }

  const newSearch = url.searchParams.toString();
  const currentSearch = new URLSearchParams(window.location.search).toString();

  if (newSearch !== currentSearch) {
    window.history.pushState({}, "", url.toString());
  }
}

export function useUrlSearchParams(
  initial: Params = {},
  types: Types = {},
): [Params, (next: Params) => void] {
  const [, forceUpdate] = useState(0);

  const params = useMemo(() => readParams(initial, types), [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    typeof window !== "undefined" ? window.location.search : "",
  ]);

  const setParams = useCallback(
    (next: Params) => {
      writeParams(next, initial);
      forceUpdate((n) => n + 1);
    },
    [initial],
  );

  useEffect(() => {
    const onPopState = () => forceUpdate((n) => n + 1);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return [params, setParams];
}
