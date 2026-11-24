import { describe, expect, it } from "vitest";
import {
  getLayerFeatureVisibility,
  removeLayerFeatureVisibility,
  setLayerFeatureVisibility,
} from "./LayerFeatureVisibility";

describe("LayerFeatureVisibility", () => {
  it("shows every optional feature by default", () => {
    expect(getLayerFeatureVisibility({}, "route-1")).toEqual({
      instructions: true,
      traffic: true,
      behavioralReplans: true,
      intervalReplans: true,
    });
  });

  it("changes one feature without changing the others", () => {
    const visibility = setLayerFeatureVisibility(
      {},
      "route-1",
      "traffic",
      false,
    );

    expect(getLayerFeatureVisibility(visibility, "route-1")).toEqual({
      instructions: true,
      traffic: false,
      behavioralReplans: true,
      intervalReplans: true,
    });
  });

  it("keeps settings separate for each layer", () => {
    const visibility = setLayerFeatureVisibility(
      {},
      "route-1",
      "instructions",
      false,
    );

    expect(getLayerFeatureVisibility(visibility, "route-1").instructions).toBe(false);
    expect(getLayerFeatureVisibility(visibility, "route-2").instructions).toBe(true);
  });

  it("removes settings with their layer", () => {
    const visibility = setLayerFeatureVisibility(
      {},
      "route-1",
      "traffic",
      false,
    );

    expect(removeLayerFeatureVisibility(visibility, "route-1")).toEqual({});
  });
});
