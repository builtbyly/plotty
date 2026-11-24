import { describe, expect, it } from "vitest";
import { serializeLayers, deserializeLayers } from "./LayerSerializer";
import { createLayer } from "../entities/Layer";
import { LogcatPath } from "../entities/LogcatPath";
import { Color } from "../value-objects/Color";
import { Path } from "../entities/Path";
import { Coordinates } from "../value-objects/Coordinates";
import { LogPoint } from "../value-objects/LogPoint";
import { LogLevel } from "../value-objects/LogLevel";
import { CrashEvent } from "../value-objects/CrashEvent";

class UnsupportedPath extends Path<Coordinates> {}

const samplePoint = new LogPoint(52.37, 4.89, LogLevel.Info, "MapMatcher", 1, new Map(), null, null, null);

describe("LayerSerializer", () => {
  it("round-trips independent feature visibility and whole-layer visibility", () => {
    const path = new LogcatPath([samplePoint], []);
    const first = createLayer("First", Color.fromHex("#ff0000"), path);
    const second = createLayer("Second", Color.fromHex("#0000ff"), path);
    first.visible = false;
    first.featureVisibility = {
      instructions: false,
      trafficSections: false,
      behavioralReplans: true,
      intervalReplans: false,
    };

    const [restoredFirst, restoredSecond] = deserializeLayers(serializeLayers([first, second]));

    expect(restoredFirst.id).toBe(first.id);
    expect(restoredFirst.visible).toBe(false);
    expect(restoredFirst.featureVisibility).toEqual(first.featureVisibility);
    expect(restoredSecond.id).toBe(second.id);
    expect(restoredSecond.visible).toBe(true);
    expect(restoredSecond.featureVisibility).toEqual({
      instructions: true,
      trafficSections: true,
      behavioralReplans: true,
      intervalReplans: true,
    });
  });

  it("defaults omitted or invalid feature settings while preserving explicit false", () => {
    const layer = createLayer("Partial", Color.fromHex("#ff0000"), new LogcatPath([samplePoint], []));
    const [savedLayer] = JSON.parse(serializeLayers([layer]));
    savedLayer.featureVisibility = { trafficSections: false, instructions: "false" };

    const [restored] = deserializeLayers(JSON.stringify([savedLayer]));

    expect(restored.featureVisibility).toEqual({
      instructions: true,
      trafficSections: false,
      behavioralReplans: true,
      intervalReplans: true,
    });
  });

  it("throws for unsupported path subtypes instead of silently serializing them as geo", () => {
    const layer = createLayer(
      "Unsupported",
      Color.fromHex("#ff0000"),
      new UnsupportedPath([new Coordinates(1, 2)], "Unsupported")
    );

    expect(() => serializeLayers([layer])).toThrow(/Unsupported path type/);
  });
});

describe("LayerSerializer — LogcatPath crash round-trip", () => {
  it("serializes and deserializes crashes correctly", () => {
    const crash: CrashEvent = {
      type: "fatal-exception",
      description: "FATAL EXCEPTION: main",
      lineNumber: 5,
      timestamp: 1000,
      nearestPointIndex: 0,
    };
    const path = new LogcatPath([samplePoint], [crash]);
    const layer = createLayer("test", Color.fromHex("#ff0000"), path);

    const json = serializeLayers([layer]);
    const restored = deserializeLayers(json);
    const restoredPath = restored[0].path as LogcatPath;

    expect(restoredPath.crashes).toHaveLength(1);
    expect(restoredPath.crashes[0].type).toBe("fatal-exception");
    expect(restoredPath.crashes[0].description).toBe("FATAL EXCEPTION: main");
    expect(restoredPath.crashes[0].nearestPointIndex).toBe(0);
  });

  it("deserializes legacy LogcatPath (no crashes field) as empty array", () => {
    const legacyJson = JSON.stringify([{
      id: "legacy-id",
      name: "Legacy",
      color: "#ff0000",
      visible: true,
      path: {
        type: "log",
        points: [{
          latitude: 52.37,
          longitude: 4.89,
          level: "INFO",
          tag: "MapMatcher",
          line: 1,
          extra: {},
          timestamp: null,
          speed: null,
          heading: null,
        }],
        // no crashes field
      },
    }]);

    const layers = deserializeLayers(legacyJson);
    expect((layers[0].path as LogcatPath).crashes).toEqual([]);
    expect(layers[0].featureVisibility).toEqual({
      instructions: true,
      trafficSections: true,
      behavioralReplans: true,
      intervalReplans: true,
    });
  });
});
