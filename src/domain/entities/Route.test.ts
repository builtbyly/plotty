import { describe, expect, it } from "vitest";
import { Route } from "./Route";
import { RouteSource } from "../value-objects/RoutingModel";

const summary = {
  departureTime: "2024-01-01T00:00:00Z",
  arrivalTime: "2024-01-01T01:00:00Z",
  lengthInMeters: 10000,
  trafficDelayInSeconds: 0,
  trafficLengthInMeters: 0,
  travelTimeInSeconds: 3600,
};

const minimalSource = (instructions: object[]): RouteSource => ({
  legs: [
    {
      points: [
        { latitude: 0, longitude: 0 },
        { latitude: 1, longitude: 1 },
      ],
      summary,
    },
  ],
  summary,
  guidance: { instructions: instructions as RouteSource["guidance"]["instructions"] },
  progress: [],
  sections: [],
});

describe("Route", () => {
  describe("instructionsFromSource", () => {
    it("new schema: uses maneuverPoint, extracts nextRoadInfo.streetName and routeOffsetInMeters", () => {
      const source = minimalSource([
        {
          drivingSide: "RIGHT",
          maneuver: "TURN_RIGHT",
          maneuverPoint: { latitude: 48.145, longitude: 11.578 },
          nextRoadInfo: { streetName: "Ludwigstraße" },
          routeOffsetInMeters: 3142,
        },
      ]);
      const route = new Route(source);
      expect(route.instructions).toHaveLength(1);
      const inst = route.instructions[0];
      expect(inst.point.latitude).toBe(48.145);
      expect(inst.point.longitude).toBe(11.578);
      expect(inst.instruction).toBe("TURN_RIGHT");
      expect(inst.streetName).toBe("Ludwigstraße");
      expect(inst.routeOffsetInMeters).toBe(3142);
    });

    it("old schema: uses point, uses instructionType as text, extracts street", () => {
      const source = minimalSource([
        {
          drivingSide: "RIGHT",
          point: { latitude: 48.2, longitude: 11.6 },
          instructionType: "TURN_LEFT",
          street: "Maximilianstraße",
          routeOffsetInMeters: 500,
        },
      ]);
      const route = new Route(source);
      expect(route.instructions).toHaveLength(1);
      const inst = route.instructions[0];
      expect(inst.point.latitude).toBe(48.2);
      expect(inst.point.longitude).toBe(11.6);
      expect(inst.instruction).toBe("TURN_LEFT");
      expect(inst.streetName).toBe("Maximilianstraße");
      expect(inst.routeOffsetInMeters).toBe(500);
    });

    it("old schema: falls back to message when instructionType is absent", () => {
      const source = minimalSource([
        {
          drivingSide: "RIGHT",
          point: { latitude: 48.3, longitude: 11.7 },
          message: "Head north",
        },
      ]);
      const route = new Route(source);
      expect(route.instructions).toHaveLength(1);
      expect(route.instructions[0].instruction).toBe("Head north");
    });

    it("skips instructions with no position point", () => {
      const source = minimalSource([
        {
          drivingSide: "RIGHT",
          instructionType: "TURN_RIGHT",
        },
      ]);
      const route = new Route(source);
      expect(route.instructions).toHaveLength(0);
    });
  });

  it("maps intermediate stops to the correct point index", () => {
    const source: RouteSource = {
      legs: [
        {
          points: [
            { latitude: 10, longitude: 10 },
            { latitude: 20, longitude: 20 },
          ],
          summary,
        },
        {
          points: [
            { latitude: 20, longitude: 20 },
            { latitude: 20, longitude: 30 },
          ],
          summary,
        },
        {
          points: [
            { latitude: 20, longitude: 30 },
            { latitude: 30, longitude: 30 },
          ],
          summary,
        },
      ],
      summary,
      guidance: { instructions: [] },
      progress: [],
      sections: [],
    };

    const route = new Route(source);

    expect(route.stops.map((stop) => stop.index)).toEqual([0, 1, 2, 3]);
  });
});
