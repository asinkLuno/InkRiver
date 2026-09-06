import type { Drift, MoaiMap } from "@/lib/api";
import { useCopy } from "@/lib/i18n";
import { EventHoverCard } from "./event-hover-card";

export function compareDriftTime(a: Drift, b: Drift): number {
  for (let i = 0; i < a.flat_start.length; i++) {
    if (a.flat_start[i] !== b.flat_start[i]) {
      return a.flat_start[i] - b.flat_start[i];
    }
  }
  return 0;
}

export function DriftGantt({
  driftKey,
  events,
  moais,
  description,
  showHeader = true,
}: {
  driftKey: string;
  events: Drift[];
  moais: MoaiMap;
  description?: string;
  showHeader?: boolean;
}) {
  const copy = useCopy();
  // Single pass for the range and first/last events: avoids the spread of
  // Math.min/Math.max (which overflows on very large event lists) and the
  // two extra array allocations from mapping before reducing.
  let minTick = events[0].start_tick;
  let maxTick = events[0].end_tick ?? events[0].start_tick;
  let firstEvent = events[0];
  let lastEvent = events[0];
  for (const event of events) {
    const endTick = event.end_tick ?? event.start_tick;
    if (event.start_tick < minTick) minTick = event.start_tick;
    if (endTick > maxTick) maxTick = endTick;
    if (event.start_tick < firstEvent.start_tick) firstEvent = event;
    if (endTick > (lastEvent.end_tick ?? lastEvent.start_tick)) lastEvent = event;
  }
  const tickRange = Math.max(maxTick - minTick, 1);
  const endDisplay = lastEvent.end_time_display ?? lastEvent.start_time_display;

  return (
    <section aria-labelledby={`gantt-${driftKey}`} className="render-lazily">
      {showHeader ? (
        <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 id={`gantt-${driftKey}`} className="font-display text-lg font-medium">
            {driftKey}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      ) : (
        <h3 id={`gantt-${driftKey}`} className="sr-only">
          {driftKey} timeline
        </h3>
      )}
      <div className="overflow-x-auto">
        <div className="min-w-[900px] overflow-hidden rounded-lg border bg-card">
          <div className="grid grid-cols-[240px_1fr] border-b bg-muted/50">
            <div className="flex h-14 items-end border-r px-4 pb-2 text-xs font-medium text-muted-foreground">
              {copy.gantt_event}
            </div>
            <div className="relative h-14 font-mono text-[11px] text-muted-foreground">
              <span className="absolute bottom-2 left-3">
                {firstEvent.start_time_display}
              </span>
              <span className="absolute right-3 bottom-2">{endDisplay}</span>
            </div>
          </div>

          {events.map((event) => {
            const left = ((event.start_tick - minTick) / tickRange) * 100;
            const endTick = event.end_tick ?? event.start_tick;
            const width = ((endTick - event.start_tick) / tickRange) * 100;
            const cardProps = {
              title: event.title,
              start: event.start_time_display,
              end: event.end_time_display,
              description: event.description ?? null,
              moais: (event.moais ?? []).map((name) => ({
                name,
                offset: moais[name]?.journal?.[event.id] ?? null,
              })),
            };

            return (
              <div
                key={event.id}
                className="grid min-h-16 grid-cols-[240px_1fr] border-b last:border-b-0"
              >
                <div className="min-w-0 border-r px-4 py-2.5">
                  <EventHoverCard
                    {...cardProps}
                    trigger={
                      <button
                        type="button"
                        className="block w-full truncate rounded-sm text-left font-display text-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        {event.title}
                      </button>
                    }
                  />
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    {(event.moais ?? []).map((name, index) => (
                      <span key={name} title={moais[name]?.description}>
                        {index > 0 ? " · " : ""}
                        {name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="relative bg-[linear-gradient(to_right,color-mix(in_oklab,var(--border)_55%,transparent)_1px,transparent_1px)] bg-[size:25%_100%]">
                  <EventHoverCard
                    {...cardProps}
                    trigger={
                      event.end_tick === null ? (
                        <button
                          type="button"
                          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] border border-primary bg-primary shadow-sm outline-none hover:ring-4 hover:ring-primary/15 focus-visible:ring-4 focus-visible:ring-ring/40"
                          style={{
                            left: `clamp(6px, ${left}%, calc(100% - 6px))`,
                          }}
                          aria-label={event.title}
                        />
                      ) : (
                        <button
                          type="button"
                          className="absolute top-1/2 h-6 min-w-1 -translate-y-1/2 rounded-[4px] border border-primary/25 bg-primary/85 shadow-sm outline-none hover:bg-primary hover:ring-4 hover:ring-primary/15 focus-visible:ring-4 focus-visible:ring-ring/40"
                          style={{ left: `${left}%`, width: `${width}%` }}
                          aria-label={event.title}
                        />
                      )
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function GanttLegend() {
  const copy = useCopy();
  return (
    <div className="mt-3 flex items-center gap-5 text-xs text-muted-foreground">
      <span className="flex items-center gap-2">
        <span className="h-2.5 w-5 rounded-[3px] bg-primary/85" /> {copy.gantt_duration}
      </span>
      <span className="flex items-center gap-2">
        <span className="size-2.5 rotate-45 rounded-[1px] bg-primary" />
        {copy.gantt_milestone}
      </span>
    </div>
  );
}
