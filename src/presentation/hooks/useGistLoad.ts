import React from "react";
import { toast } from "react-toastify";
import { Layer } from "../../domain/entities/Layer";
import { AnyPath } from "../../domain/entities/Path";
import { deserializeLayers } from "../../domain/utils/LayerSerializer";

const GIST_API = "https://api.github.com/gists";

export function useGistLoad(
  clearAll: () => void,
  addLayers: (layers: Layer<AnyPath>[]) => void,
  onLoaded?: (layers: Layer<AnyPath>[]) => void,
): void {
  React.useEffect(() => {
    const gistId = new URLSearchParams(window.location.search).get("gist");
    if (!gistId) return;

    (async () => {
      try {
        const res = await fetch(`${GIST_API}/${gistId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as {
          files?: Record<string, { content: string; truncated: boolean; raw_url: string }>;
        };
        const file = data.files?.["plotty-session.json"];
        if (!file) throw new Error("plotty-session.json not found in gist");
        let content: string;
        if (file.truncated) {
          const rawRes = await fetch(file.raw_url);
          if (!rawRes.ok) throw new Error(`raw fetch HTTP ${rawRes.status}`);
          content = await rawRes.text();
        } else {
          content = file.content;
        }
        const layers = deserializeLayers(content);
        clearAll();
        addLayers(layers);
        onLoaded?.(layers);
        history.replaceState(null, "", window.location.pathname);
      } catch (e) {
        console.error("useGistLoad error:", e);
        toast.error("Failed to load shared session");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
