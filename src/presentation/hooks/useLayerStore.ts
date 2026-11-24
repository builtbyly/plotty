import React from "react";
import { Layer } from "../../domain/entities/Layer";
import { AnyPath } from "../../domain/entities/Path";
import { Color } from "../../domain/value-objects/Color";
import { usePersistedLayers } from "./usePersistedLayers";
import {
  getLayerFeatureVisibility,
  LayerFeature,
  LayerFeatureVisibility,
  LayerFeatureVisibilityById,
  removeLayerFeatureVisibility,
  setLayerFeatureVisibility,
} from "../layers/LayerFeatureVisibility";

export interface LayerStore {
  layers: Layer<AnyPath>[];
  addLayers(layers: Layer<AnyPath>[]): void;
  toggleVisibility(id: string): void;
  rename(id: string, newName: string): void;
  remove(id: string): void;
  recolor(id: string, hex: string): void;
  reorder(fromIndex: number, toIndex: number): void;
  clearAll(): void;
  getFeatureVisibility(id: string): LayerFeatureVisibility;
  setFeatureVisibility(id: string, feature: LayerFeature, visible: boolean): void;
}

export function useLayerStore(): LayerStore {
  const [layers, setLayers] = usePersistedLayers();
  const [featureVisibilityById, setFeatureVisibilityById] =
    React.useState<LayerFeatureVisibilityById>({});

  const addLayers = React.useCallback((newLayers: Layer<AnyPath>[]) => {
    setLayers((prev) => [...prev, ...newLayers]);
  }, [setLayers]);

  const toggleVisibility = React.useCallback((id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  }, [setLayers]);

  const rename = React.useCallback((id: string, newName: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, name: newName } : l))
    );
  }, [setLayers]);

  const remove = React.useCallback((id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    setFeatureVisibilityById((prev) => removeLayerFeatureVisibility(prev, id));
  }, [setLayers]);

  const recolor = React.useCallback((id: string, hex: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, color: Color.fromHex(hex) } : l))
    );
  }, [setLayers]);

  const reorder = React.useCallback((fromIndex: number, toIndex: number) => {
    setLayers((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, [setLayers]);

  const clearAll = React.useCallback(() => {
    setLayers([]);
    setFeatureVisibilityById({});
  }, [setLayers]);

  const getFeatureVisibility = React.useCallback(
    (id: string) => getLayerFeatureVisibility(featureVisibilityById, id),
    [featureVisibilityById],
  );

  const setFeatureVisibility = React.useCallback(
    (id: string, feature: LayerFeature, visible: boolean) => {
      setFeatureVisibilityById((prev) =>
        setLayerFeatureVisibility(prev, id, feature, visible),
      );
    },
    [],
  );

  return {
    layers,
    addLayers,
    toggleVisibility,
    rename,
    remove,
    recolor,
    reorder,
    clearAll,
    getFeatureVisibility,
    setFeatureVisibility,
  };
}
