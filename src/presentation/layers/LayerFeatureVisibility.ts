export interface LayerFeatureVisibility {
  instructions: boolean;
  traffic: boolean;
  behavioralReplans: boolean;
  intervalReplans: boolean;
}

export type LayerFeature = keyof LayerFeatureVisibility;

export type LayerFeatureVisibilityById = Record<
  string,
  Partial<LayerFeatureVisibility>
>;

const defaultFeatureVisibility: LayerFeatureVisibility = {
  instructions: true,
  traffic: true,
  behavioralReplans: true,
  intervalReplans: true,
};

export function getLayerFeatureVisibility(
  visibilityById: LayerFeatureVisibilityById,
  layerId: string,
): LayerFeatureVisibility {
  return {
    ...defaultFeatureVisibility,
    ...visibilityById[layerId],
  };
}

export function setLayerFeatureVisibility(
  visibilityById: LayerFeatureVisibilityById,
  layerId: string,
  feature: LayerFeature,
  visible: boolean,
): LayerFeatureVisibilityById {
  return {
    ...visibilityById,
    [layerId]: {
      ...visibilityById[layerId],
      [feature]: visible,
    },
  };
}

export function removeLayerFeatureVisibility(
  visibilityById: LayerFeatureVisibilityById,
  layerId: string,
): LayerFeatureVisibilityById {
  return Object.fromEntries(
    Object.entries(visibilityById).filter(([id]) => id !== layerId),
  );
}
