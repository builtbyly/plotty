import { describe, it, expect } from "vitest";
import { LogcatParser } from "./LogcatParser";
import { LogPath } from "../../entities/LogPath";
import { Maybe } from "../../../shared/Maybe";

const parser = new LogcatParser();

// MM-DD HH:MM:SS.SSS PID TID LEVEL TAG: message
const mapMatcherLine =
  "04-19 10:00:00.000 1234 1234 I MapMatcher: MatchLocation result: lat: 52.37403, lon: 4.88969, arc_key: 123, on road: true";

const navigationLine =
  "04-19 10:00:01.000 1234 1234 I TomTomNavigation: 5th progress for the route (100) calculated: RouteProgress(latitude=52.38000 longitude=4.89000 distanceAlongRoute 500.0 m)";

const fatalExceptionLine =
  "04-19 10:00:05.000 1234 1235 E AndroidRuntime: FATAL EXCEPTION: main";

const fatalSignalLine =
  "04-19 10:00:06.000 1234 1235 E libc: Fatal signal 11 (SIGSEGV), code 1, fault addr 0x0 in tid 1234";

const anrLine =
  "04-19 10:00:07.000 1234 1235 E ActivityManager: ANR in com.example.app (com.example.app/.MainActivity)";

describe("LogcatParser", () => {
  it("parses a MapMatcher logcat line", () => {
    const result = parser.parse(mapMatcherLine);
    expect(Maybe.isSuccess(result)).toBe(true);
    if (Maybe.isSuccess(result)) {
      expect(result.value.paths).toHaveLength(1);
      const points = result.value.paths[0].points;
      expect(points[0].latitude).toBeCloseTo(52.37403);
      expect(points[0].longitude).toBeCloseTo(4.88969);
    }
  });

  it("parses a TomTomNavigation logcat line", () => {
    const result = parser.parse(navigationLine);
    expect(Maybe.isSuccess(result)).toBe(true);
    if (Maybe.isSuccess(result)) {
      expect(result.value.paths[0].points).toHaveLength(1);
    }
  });

  it("parses multiple points from multiple lines", () => {
    const text = [mapMatcherLine, mapMatcherLine, mapMatcherLine].join("\n");
    const result = parser.parse(text);
    expect(Maybe.isSuccess(result)).toBe(true);
    if (Maybe.isSuccess(result)) {
      expect(result.value.paths[0].points).toHaveLength(3);
    }
  });

  it("returns failure when no recognized lines are found", () => {
    const result = parser.parse("some random log line without matching tags");
    expect(Maybe.isFailure(result)).toBe(true);
  });

  it("returns failure on empty input", () => {
    const result = parser.parse("");
    expect(Maybe.isFailure(result)).toBe(true);
  });

  it("skips malformed lines and parses the rest", () => {
    const text = ["garbage ??? !!!", mapMatcherLine].join("\n");
    const result = parser.parse(text);
    expect(Maybe.isSuccess(result)).toBe(true);
    if (Maybe.isSuccess(result)) {
      expect(result.value.paths[0].points).toHaveLength(1);
    }
  });
});

describe("LogcatParser — timestamp parsing", () => {
  it("parses YYYY-MM-DD timestamp with timezone offset to correct UTC epoch", () => {
    const line =
      "2026-05-22 06:57:23.039 +0200 6634 10433 I MapMatcherOrchestrator: MatchLocation result: lat: 52.37403, lon: 4.88969, arc_key: 123, on road: true";
    const result = parser.parse(line);
    expect(Maybe.isSuccess(result)).toBe(true);
    if (Maybe.isSuccess(result)) {
      const ts = result.value.paths[0].points[0].timestamp;
      expect(ts).toBe(Date.UTC(2026, 4, 22, 4, 57, 23, 39));
    }
  });

  it("parses MM-DD timestamp without timezone", () => {
    const line =
      "05-22 06:57:23.039 6634 6634 I MapMatcher: MatchLocation result: lat: 52.37403, lon: 4.88969, arc_key: 123, on road: true";
    const result = parser.parse(line);
    expect(Maybe.isSuccess(result)).toBe(true);
    if (Maybe.isSuccess(result)) {
      const ts = result.value.paths[0].points[0].timestamp;
      expect(ts).toBeGreaterThan(0);
    }
  });
});

// K5 replan lines (MM-DD format, tag "K5")
const replanTriggerBehavioral =
  "04-19 10:00:02.000 1234 1234 I K5: Trigger replanning(back to route due to a deviation)";
const replanTriggerInterval =
  "04-19 10:00:03.000 1234 1234 I K5: Trigger replanning(replan time interval reached)";
const replanFailed =
  "04-19 10:00:04.000 1234 1234 E K5: Replanning (back to route due to a deviation) failed with error='Unable to compute route'";

describe("LogcatParser — replan detection", () => {
  it("detects behavioral trigger and sets nearestPointIndex to last point before replan", () => {
    const text = [mapMatcherLine, replanTriggerBehavioral].join("\n");
    const result = parser.parse(text);
    expect(Maybe.isSuccess(result)).toBe(true);
    if (Maybe.isSuccess(result)) {
      const path = result.value.paths[0] as LogPath;
      expect(path.replanEvents).toHaveLength(1);
      expect(path.replanEvents[0].category).toBe("behavioral");
      expect(path.replanEvents[0].outcome).toBe("triggered");
      expect(path.replanEvents[0].reason).toBe("back to route due to a deviation");
      expect(path.replanEvents[0].errorMessage).toBeNull();
      expect(path.replanEvents[0].nearestPointIndex).toBe(0);
    }
  });

  it("detects interval trigger", () => {
    const text = [mapMatcherLine, replanTriggerInterval].join("\n");
    const result = parser.parse(text);
    expect(Maybe.isSuccess(result)).toBe(true);
    if (Maybe.isSuccess(result)) {
      const path = result.value.paths[0] as LogPath;
      expect(path.replanEvents).toHaveLength(1);
      expect(path.replanEvents[0].category).toBe("interval");
      expect(path.replanEvents[0].outcome).toBe("triggered");
    }
  });

  it("detects failed replan with errorMessage", () => {
    const text = [mapMatcherLine, replanFailed].join("\n");
    const result = parser.parse(text);
    expect(Maybe.isSuccess(result)).toBe(true);
    if (Maybe.isSuccess(result)) {
      const path = result.value.paths[0] as LogPath;
      expect(path.replanEvents).toHaveLength(1);
      expect(path.replanEvents[0].category).toBe("behavioral");
      expect(path.replanEvents[0].outcome).toBe("failed");
      expect(path.replanEvents[0].errorMessage).toBe("Unable to compute route");
      expect(path.replanEvents[0].nearestPointIndex).toBe(0);
    }
  });

  it("assigns nearestPointIndex -1 when replan precedes all points", () => {
    const text = [replanTriggerBehavioral, mapMatcherLine].join("\n");
    const result = parser.parse(text);
    expect(Maybe.isSuccess(result)).toBe(true);
    if (Maybe.isSuccess(result)) {
      const path = result.value.paths[0] as LogPath;
      expect(path.replanEvents).toHaveLength(1);
      expect(path.replanEvents[0].nearestPointIndex).toBe(-1);
    }
  });

  it("tracks nearestPointIndex across multiple points", () => {
    const text = [mapMatcherLine, mapMatcherLine, replanTriggerBehavioral].join("\n");
    const result = parser.parse(text);
    expect(Maybe.isSuccess(result)).toBe(true);
    if (Maybe.isSuccess(result)) {
      const path = result.value.paths[0] as LogPath;
      expect(path.replanEvents[0].nearestPointIndex).toBe(1);
    }
  });

  it("produces no replan events when none are present", () => {
    const result = parser.parse(mapMatcherLine);
    expect(Maybe.isSuccess(result)).toBe(true);
    if (Maybe.isSuccess(result)) {
      const path = result.value.paths[0] as LogPath;
      expect(path.replanEvents).toHaveLength(0);
    }
  });
});

describe("LogcatParser — crash detection", () => {
  it("detects FATAL EXCEPTION and sets nearestPointIndex to last point before crash", () => {
    const text = [mapMatcherLine, fatalExceptionLine].join("\n");
    const result = parser.parse(text);
    expect(Maybe.isSuccess(result)).toBe(true);
    if (Maybe.isSuccess(result)) {
      const path = result.value.paths[0] as LogPath;
      expect(path.crashes).toHaveLength(1);
      expect(path.crashes[0].type).toBe("fatal-exception");
      expect(path.crashes[0].nearestPointIndex).toBe(0);
      expect(path.crashes[0].description).toMatch(/FATAL EXCEPTION/);
    }
  });

  it("assigns nearestPointIndex -1 when crash precedes all points", () => {
    const text = [fatalExceptionLine, mapMatcherLine].join("\n");
    const result = parser.parse(text);
    expect(Maybe.isSuccess(result)).toBe(true);
    if (Maybe.isSuccess(result)) {
      const path = result.value.paths[0] as LogPath;
      expect(path.crashes).toHaveLength(1);
      expect(path.crashes[0].nearestPointIndex).toBe(-1);
    }
  });

  it("detects Fatal signal with correct type", () => {
    const text = [mapMatcherLine, fatalSignalLine].join("\n");
    const result = parser.parse(text);
    expect(Maybe.isSuccess(result)).toBe(true);
    if (Maybe.isSuccess(result)) {
      const path = result.value.paths[0] as LogPath;
      expect(path.crashes).toHaveLength(1);
      expect(path.crashes[0].type).toBe("fatal-signal");
      expect(path.crashes[0].description).toMatch(/Fatal signal 11/);
    }
  });

  it("detects ANR with correct type", () => {
    const text = [mapMatcherLine, anrLine].join("\n");
    const result = parser.parse(text);
    expect(Maybe.isSuccess(result)).toBe(true);
    if (Maybe.isSuccess(result)) {
      const path = result.value.paths[0] as LogPath;
      expect(path.crashes).toHaveLength(1);
      expect(path.crashes[0].type).toBe("anr");
      expect(path.crashes[0].description).toMatch(/ANR in com\.example/);
    }
  });

  it("tracks nearestPointIndex across multiple points", () => {
    const text = [mapMatcherLine, mapMatcherLine, fatalExceptionLine].join("\n");
    const result = parser.parse(text);
    expect(Maybe.isSuccess(result)).toBe(true);
    if (Maybe.isSuccess(result)) {
      const path = result.value.paths[0] as LogPath;
      expect(path.crashes[0].nearestPointIndex).toBe(1);
    }
  });

  it("produces no crashes when none are present", () => {
    const result = parser.parse(mapMatcherLine);
    expect(Maybe.isSuccess(result)).toBe(true);
    if (Maybe.isSuccess(result)) {
      const path = result.value.paths[0] as LogPath;
      expect(path.crashes).toHaveLength(0);
    }
  });
});
