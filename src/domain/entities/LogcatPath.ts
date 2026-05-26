import { CrashEvent } from "../value-objects/CrashEvent";
import { ReplanEvent } from "../value-objects/ReplanEvent";
import { LogPoint } from "../value-objects/LogPoint";
import { Path } from "./Path";

export class LogcatPath extends Path<LogPoint> {
  private static counter = 0;

  constructor(
    points: LogPoint[],
    public readonly crashes: CrashEvent[] = [],
    public readonly replanEvents: ReplanEvent[] = []
  ) {
    super(points, `Logcat ${++LogcatPath.counter}`);
  }
}
