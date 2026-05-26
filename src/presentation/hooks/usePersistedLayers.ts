import React from "react";
import { toast } from "react-toastify";
import { Layer } from "../../domain/entities/Layer";
import { AnyPath } from "../../domain/entities/Path";
import { serializeLayers, deserializeLayers } from "../../domain/utils/LayerSerializer";

const STORAGE_KEY = "plotty_layers";

function loadFromStorage(): Layer<AnyPath>[] {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    return deserializeLayers(json);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

export function usePersistedLayers() {
  const [layers, setLayers] = React.useState<Layer<AnyPath>[]>(() => loadFromStorage());
  const hasWarnedRef = React.useRef(false);

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, serializeLayers(layers));
    } catch {
      if (!hasWarnedRef.current) {
        hasWarnedRef.current = true;
        toast.warn("Couldn't save layers — changes won't persist after refresh.");
      }
    }
  }, [layers]);

  return [layers, setLayers] as const;
}
