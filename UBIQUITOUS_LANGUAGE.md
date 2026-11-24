# Ubiquitous Language

## Imported geographic data

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Import** | The conversion of pasted text or a dropped file into one or more **Paths**. | Upload, ingest |
| **Path** | An ordered collection of geographic **Coordinates** that Plotty can display. | Track, geometry, data |
| **Coordinate** | A geographic location expressed as latitude and longitude. | Point, position, location |
| **Geo Path** | A **Path** imported from GeoJSON or raw coordinates and displayed as points, a line, or a polygon. | Generic path, geometry path |
| **TTP Path** | A **Path** imported from TomTom Positioning data whose coordinates may carry positioning metadata. | TTP layer, positioning track |
| **Logcat Path** | A **Path** reconstructed from Android logcat entries and associated navigation events. | Log path, logcat layer |
| **Route** | A navigable **Path** containing route-specific information such as **Legs**, **Stops**, **Instructions**, traffic, and progress. | Route path, route layer |

## Route structure

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Leg** | A contiguous part of a **Route** between two consecutive **Stops**. | Segment |
| **Stop** | An origin, destination, or intermediate waypoint that divides a **Route** into **Legs**. | Point, marker |
| **Instruction** | Guidance attached to a location along a **Route**. | Step, maneuver marker |
| **Traffic Section** | A contiguous range of **Route** coordinates carrying traffic information. | Traffic layer, traffic segment |
| **Progress Checkpoint** | Cumulative travel time and distance recorded at a particular coordinate index along a **Route**. | Progress point, checkpoint marker |
| **Deviation** | The time, distance, and location by which an alternative **Route** diverges from the main route. | Alternative delta |

## Display model

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Layer** | A displayable instance of one **Path**, with its own name, color, visibility, and position in the ordered layer collection. | Path, map layer, layer stack item |
| **Layer Visibility** | Whether an entire **Layer** is displayed on the **Map**. | Enabled, active |
| **Feature Visibility** | Whether optional details within a visible **Layer**, such as **Instructions**, **Traffic Sections**, or replans, are displayed. | Layer visibility, toggle state |
| **Map** | The interactive geographic view containing the **Basemap** and displayed **Layers**. | Workspace, canvas |
| **Basemap** | The tile imagery drawn underneath Plotty's **Layers**. | Map, tile layer, provider |
| **Layer Panel** | The user interface for inspecting and changing the ordered collection of **Layers**. | Workspace, layer manager |

## Navigation-log events

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Replan** | A navigation event in which the current route is recalculated for a recorded reason and outcome. | Reroute, route change |
| **Crash Event** | A recorded application failure associated with the nearest coordinate in a **Logcat Path**. | Crash marker, error point |

## Saved and shared data

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Session** | A serialized collection of **Layers** that can be restored locally or shared through a GitHub Gist. | Workspace, project, document |
| **Local Session** | A **Session** stored in the browser for restoration on the next visit. | Cache, local workspace |
| **Shared Session** | A **Session** stored in a GitHub Gist and referenced by a shareable Plotty link. | Shared workspace, share |

## Relationships

- An **Import** produces zero or more **Paths**.
- A **Layer** contains exactly one **Path**.
- A **Path** can appear in one **Layer** at a time in the current implementation.
- A **Route** is a specialized **Path** composed of one or more **Legs**.
- A **Leg** begins and ends at consecutive **Stops**.
- A **Map** contains one **Basemap** and zero or more visible **Layers**.
- A **Session** contains zero or more ordered **Layers**.
- **Layer Visibility** controls the whole **Layer**; **Feature Visibility** controls details inside it.
- A **Logcat Path** can contain zero or more **Replans** and **Crash Events**.

## Example dialogue

> **Developer:** "What happens when someone drops route JSON onto the **Map**?"
>
> **Domain expert:** "The **Import** produces one or more **Routes**. Plotty places each **Route** in a new **Layer** with its own name, color, and **Layer Visibility**."
>
> **Developer:** "If the user hides **Instructions**, is the **Layer** hidden?"
>
> **Domain expert:** "No. That changes **Feature Visibility**. The route line remains visible until **Layer Visibility** is turned off."
>
> **Developer:** "And sharing saves the same state?"
>
> **Domain expert:** "Yes. A **Shared Session** saves the ordered **Layers** and their **Feature Visibility** settings, just like a **Local Session**."

## Flagged ambiguities

- **Point** currently means several things: a geographic coordinate, a path-specific record, and a rendered marker. Use **Coordinate** for latitude/longitude, the specific term (**Stop**, **Instruction**, or **Progress Checkpoint**) for domain records, and "marker" only for the rendered map symbol.
- **Path** and **Layer** are sometimes treated as synonyms. A **Path** is the imported geographic data; a **Layer** is how one path participates in the map display.
- **Layer Visibility** and **Feature Visibility** are both represented by checkboxes but have different meanings. Keep those terms distinct.
- **Map** and **Basemap** are sometimes conflated. The **Map** is the complete interactive view; the **Basemap** is only its background tiles.
- A **Session** saves **Layers** and their **Feature Visibility**. Older sessions without these settings show all optional features by default.
- **Workspace** and **Layer Stack** do not name established Plotty concepts. Do not introduce them; use **Map**, **Layers**, **Layer Panel**, or **Session** according to the intended meaning.
- `MapLayers` is an implementation name, not a domain term. It currently coordinates importing, the **Layer Panel**, map interactions, and rendering in addition to displaying **Layers**.
