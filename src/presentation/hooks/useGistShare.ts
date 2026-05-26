import React from "react";
import { toast } from "react-toastify";
import { Layer } from "../../domain/entities/Layer";
import { AnyPath } from "../../domain/entities/Path";
import { serializeLayers } from "../../domain/utils/LayerSerializer";

const PAT_KEY = "github_pat";
const GIST_API = "https://api.github.com/gists";

export function useGistShare(layers: Layer<AnyPath>[]): { share: () => Promise<void>; sharing: boolean } {
  const [sharing, setSharing] = React.useState(false);

  const share = React.useCallback(async () => {
    const pat = localStorage.getItem(PAT_KEY) ?? "";
    setSharing(true);
    try {
      const content = serializeLayers(layers);
      const res = await fetch(GIST_API, {
        method: "POST",
        headers: {
          Authorization: `token ${pat}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          public: true,
          files: { "plotty-session.json": { content } },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { id: string };
      const url = `${window.location.origin}${window.location.pathname}?gist=${data.id}`;
      await navigator.clipboard.writeText(url);
      toast("Link copied!");
    } catch {
      toast.error("Failed to share");
    } finally {
      setSharing(false);
    }
  }, [layers]);

  return { share, sharing };
}
