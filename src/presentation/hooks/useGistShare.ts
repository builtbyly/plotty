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
      if (!res.ok) {
        if (res.status === 401) throw Object.assign(new Error(), { status: 401 });
        if (res.status === 422) throw Object.assign(new Error(), { status: 422 });
        throw Object.assign(new Error(), { status: res.status });
      }
      const data = await res.json() as { id: string };
      const url = `${window.location.origin}${window.location.pathname}?gist=${data.id}`;
      await navigator.clipboard.writeText(url);
      toast("Link copied!");
    } catch (e) {
      const status = (e as { status?: number }).status;
      if (status === 401) toast.error("Invalid GitHub PAT — update it via the key button.");
      else if (status === 422) toast.error("Session too large to share as a Gist.");
      else toast.error("Failed to share — check your PAT and network.");
    } finally {
      setSharing(false);
    }
  }, [layers]);

  return { share, sharing };
}
