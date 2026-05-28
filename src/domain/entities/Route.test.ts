import { describe, expect, it, beforeEach } from "vitest";
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

function makeSource(overrides: Partial<RouteSource> = {}): RouteSource {
  return {
    legs: [
      {
        points: [
          { latitude: 10, longitude: 10 },
          { latitude: 20, longitude: 20 },
        ],
        summary,
      },
    ],
    summary,
    guidance: { instructions: [] },
    progress: [],
    sections: [],
    ...overrides,
  };
}

// Reset the static counter before each test so naming is deterministic
beforeEach(() => {
  (Route as unknown as { counter: number }).counter = 0;
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

  it("names a route without deviationTime as 'Route N'", () => {
    const route = new Route(makeSource());
    expect(route.getName()).toBe("Route 1");
  });

  it("names a route with deviationTime as 'Route N [alt +Xs]'", () => {
    const source = makeSource({
      summary: { ...summary, deviationTime: 128 },
    });
    const route = new Route(source);
    expect(route.getName()).toBe("Route 1 [alt +128s]");
  });

  it("rounds deviationTime in the route name", () => {
    const source = makeSource({
      summary: { ...summary, deviationTime: 79.6 },
    });
    const route = new Route(source);
    expect(route.getName()).toBe("Route 1 [alt +80s]");
  });

  it("extracts deviationPoint from summary when present", () => {
    const source = makeSource({
      summary: {
        ...summary,
        deviationTime: 79,
        deviationDistance: 132,
        deviationPoint: { latitude: 48.131, longitude: 11.589 },
      },
    });
    const route = new Route(source);
    expect(route.deviationPoint).toBeDefined();
    expect(route.deviationPoint?.latitude).toBe(48.131);
    expect(route.deviationPoint?.longitude).toBe(11.589);
  });

  it("has no deviationPoint when summary.deviationPoint is absent", () => {
    const route = new Route(makeSource());
    expect(route.deviationPoint).toBeUndefined();
  });

  it("builds legMembership correctly for a 2-leg route", () => {
    const source: RouteSource = {
      legs: [
        {
          points: [
            { latitude: 10, longitude: 10 },
            { latitude: 20, longitude: 20 },
            { latitude: 30, longitude: 30 },
          ],
          summary,
        },
        {
          points: [
            { latitude: 30, longitude: 30 },
            { latitude: 40, longitude: 40 },
            { latitude: 50, longitude: 50 },
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
    // leg 0: indices 0,1,2 (3 points), leg 1: indices 3,4 (2 points, first shared one dropped)
    expect(route.legMembership).toEqual([0, 0, 0, 1, 1]);
  });
});
