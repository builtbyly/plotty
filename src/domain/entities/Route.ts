import { dropFirst, last, dropLast, first } from "../../shared/array-utils";
import { GooglePolylineEncodingUtil } from "../utils/encoding-utils";
import { Path } from "./Path";
import { RouteSource, Summary } from "../value-objects/RoutingModel";
import { Coordinates } from "../value-objects/Coordinates";
import { RoutePoint } from "../value-objects/RoutePoint";
import { RouteLeg } from "../value-objects/RouteLeg";
import { RouteStop } from "../value-objects/RouteStop";
import { RouteInstruction } from "../value-objects/RouteInstruction";

/**
 * Represents a route, which is a collection of geographic points, stops, and instructions.
 *
 * @property {RoutePoint[]} points - The geographic points that make up the route.
 * @property {RouteStop[]} stops - The stops along the route.
 * @property {RouteInstruction[]} instructions - The guidance instructions along the route.
 */
export class Route extends Path<RoutePoint> {
  /**
   * A counter to keep track of the number of routes created.
   */
  private static counter = 0;

  legs: RouteLeg[];
  stops: RouteStop[];
  instructions: RouteInstruction[];
  readonly source: RouteSource;
  readonly summary: Summary;
  readonly deviationPoint?: Coordinates;
  readonly legMembership: number[];

  constructor(source: RouteSource) {
    const count = ++Route.counter;
    const name = source.summary.deviationTime !== undefined
      ? `Route ${count} [alt +${Math.round(source.summary.deviationTime)}s]`
      : `Route ${count}`;
    super([], name);
    this.legs = this.legsFromSource(source);
    this.points = this.toRoutePoints(this.pointsFromLegs(this.legs));
    this.legMembership = this.buildLegMembership(this.legs);
    this.stops = this.stopsFromPath(this);
    this.instructions = this.instructionsFromSource(source);
    this.source = source;
    this.summary = source.summary;
    this.deviationPoint = source.summary.deviationPoint
      ? new Coordinates(source.summary.deviationPoint.latitude, source.summary.deviationPoint.longitude)
      : undefined;
  }

  private buildLegMembership(legs: RouteLeg[]): number[] {
    const membership: number[] = [];
    legs.forEach((leg, legIndex) => {
      const pointsToAdd = legIndex === 0 ? leg.points.length : leg.points.length - 1;
      for (let i = 0; i < pointsToAdd; i++) {
        membership.push(legIndex);
      }
    });
    return membership;
  }

  private legsFromSource(source: RouteSource): RouteLeg[] {
    if (this.isEncodedPolyline(source)) {
      return this.decodeRouteLegs(source);
    } else {
      return this.extractRouteLegs(source);
    }
  }

  private isEncodedPolyline(source: RouteSource): boolean {
    return (
      source.legs.length > 0 && source.legs[0].encodedPolyline !== undefined
    );
  }

  private pointsFromLegs(legs: RouteLeg[]): Coordinates[] {
    return legs.flatMap((leg, index) => {
      return index === 0 ? leg.points : dropFirst(leg.points);
    });
  }

  private toRoutePoints(points: Coordinates[]): RoutePoint[] {
    return points.map(
      (point) =>
        new RoutePoint(point.latitude, point.longitude, null, null, null)
    );
  }

  private decodeRouteLegs(source: RouteSource): RouteLeg[] {
    return source.legs.map((leg) => {
      const decodedPolyline = GooglePolylineEncodingUtil.decode(
        leg.encodedPolyline ?? "",
        leg.encodedPolylinePrecision ?? 5
      );
      return {
        summary: leg.summary,
        points: decodedPolyline,
      };
    });
  }

  private extractRouteLegs(source: RouteSource): RouteLeg[] {
    return source.legs.map(
      (leg) =>
        new RouteLeg(
          leg.summary,
          leg.points.map(
            (point) => new Coordinates(point.latitude, point.longitude)
          )
        )
    );
  }

  private stopsFromPath(path: Route): RouteStop[] {
    const legs = path.legs;

    const firstPoint = first(first(legs).points);
    const origin = new RouteStop(
      firstPoint.latitude,
      firstPoint.longitude,
      0,
      "Origin",
      false
    );

    const lastPoint = last(last(legs).points);
    const destination = new RouteStop(
      lastPoint.latitude,
      lastPoint.longitude,
      path.points.length - 1,
      "Destination",
      false
    );

    const stops = this.intermediateStopsFromPath(path);

    return [origin, ...stops, destination];
  }

  private intermediateStopsFromPath(path: Route): RouteStop[] {
    let index = 0;

    const seekPointIndex = (index: number, point: Coordinates) => {
      while (
        index < path.points.length &&
        (
          path.points[index].latitude !== point.latitude ||
          path.points[index].longitude !== point.longitude
        )
      ) {
        index++;
      }
      return index;
    };

    const stops = dropLast(
      path.legs.map((leg) => ({
        isChargingStop: leg.summary.chargingInformationAtEndOfLeg !== undefined,
        point: last(leg.points),
      }))
    ).map(({ isChargingStop, point }) => {
      index = seekPointIndex(index, point);
      return new RouteStop(
        point.latitude,
        point.longitude,
        index,
        "waypoint",
        isChargingStop
      );
    });

    return stops;
  }

  private instructionsFromSource(source: RouteSource): RouteInstruction[] {
    try {
      const result: RouteInstruction[] = [];
      for (const instruction of source.guidance.instructions) {
        const isNewSchema = instruction.maneuverPoint !== undefined;
        if (isNewSchema) {
          const pt = instruction.maneuverPoint!;
          result.push(
            new RouteInstruction(
              new Coordinates(pt.latitude, pt.longitude),
              instruction.maneuver ?? "",
              instruction.nextRoadInfo?.streetName,
              instruction.routeOffsetInMeters,
            )
          );
        } else {
          const pt = instruction.point;
          if (!pt) continue;
          result.push(
            new RouteInstruction(
              new Coordinates(pt.latitude, pt.longitude),
              instruction.instructionType ?? instruction.message ?? "",
              instruction.street,
              instruction.routeOffsetInMeters,
            )
          );
        }
      }
      return result;
    } catch (e) {
      console.warn("Failed to parse route instructions:", e);
      return [];
    }
  }
}
