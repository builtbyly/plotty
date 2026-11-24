import { Color } from "../value-objects/Color";
import { AnyPath } from "./Path";
import { v4 as uuid } from "uuid";

export interface LayerFeatureVisibility {
  instructions: boolean;
  trafficSections: boolean;
  behavioralReplans: boolean;
  intervalReplans: boolean;
}

export type LayerFeature = keyof LayerFeatureVisibility;

export interface Layer<T extends AnyPath> {
  readonly id: string;
  name: string;
  color: Color;
  visible: boolean;
  featureVisibility: LayerFeatureVisibility;
  path: T;
}

export function createLayer<T extends AnyPath>(
  name: string,
  color: Color,
  path: T
): Layer<T> {
  return {
    id: uuid(),
    name,
    color,
    visible: true,
    featureVisibility: {
      instructions: true,
      trafficSections: true,
      behavioralReplans: true,
      intervalReplans: true,
    },
    path,
  };
}
