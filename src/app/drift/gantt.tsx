import type { ReactNode } from "react";
import type { Drift, MoaiMap } from "@/lib/api";
import { COPY, initialLanguage } from "@/lib/i18n";
import { dyeVar, eventDyeVar } from "@/lib/palette";
import { EventHoverCard } from "./event-hover-card";

export function compareDriftTime(a: Drift, b: Drift): number {
  for (let i = 0; i < a.flat_start.length; i++) {
    if (a.flat_start[i] !== b.flat_start[i]) {
      return a.flat_start[i] - b.flat_start[i];
    }
  }
  return 0;
}

export function MoaiChips({
  names,
  moais,
  empty = false,
}: {
  names: readonly string[];
  moais: MoaiMap;
  empty?: boolean;
}) {
  if (names.length === 0) {
    return empty ? null : <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <span className="flex flex-wrap items-center gap-1">
      {names.map((name) => (
        <span
          key={name}
          title={moais[name]?.description ?? name}
          className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] leading-4 text-muted-foreground"
        >
          <span
            aria-hidden="true"
            className="size-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: dyeVar(name, moais) }}
          />
          <span className="truncate">{name}</span>
        </span>
      ))}
    </span>
  );
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
  description?: ReactNode;
  showHeader?: boolean;
}) {
  const minTick = Math.min(...events.map((event) => event.start_tick));
  const maxTick = Math.max(
    ...events.map((event) => event.end_tick ?? event.start_tick),
  );
  const tickRange = Math.max(maxTick - minTick, 1);
  const firstEvent = events.reduce((first, event) =>
    event.start_tick < first.start_tick ? event : first,
  );
  const lastEvent = events.reduce((last, event) => {
    const eventTick = event.end_tick ?? event.start_tick;
    const lastTick = last.end_tick ?? last.start_tick;
    return eventTick > lastTick ? event : last;
  });
  const endDisplay = lastEvent.end_time_display ?? lastEvent.start_time_display;

  return (
    <section aria-labelledby={`gantt-${driftKey}`} className="render-lazily">
      {showHeader ? (
        <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 id={`gantt-${driftKey}`} className="text-lg font-semibold">
            {driftKey}
          </h2>
          {description && (
            <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      ) : (
        <h3 id={`gantt-${driftKey}`} className="sr-only">
          {driftKey} timeline
        </h3>
      )}
      <div className="overflow-x-auto">
        <div className="min-w-[900px] overflow-hidden rounded-lg border bg-card">
          <div className="grid grid-cols-[240px_1fr] border-b bg-muted/60">
            <div className="flex h-12 items-end border-r px-4 pb-2 text-xs font-medium text-muted-foreground">
              {COPY[initialLanguage()].gantt_event}
            </div>
            <div className="relative h-12 text-xs text-muted-foreground tnum">
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
            const dye = eventDyeVar(event.moais, moais);
            const cardProps = {
              title: event.title,
              start: event.start_time_display,
              end: event.end_time_display,
              description: event.description ?? null,
              moaiMap: moais,
              moais: (event.moais ?? []).map((name) => ({
                name,
                offset: moais[name]?.journal?.[event.id] ?? null,
              })),
            };

            return (
              <div
                key={event.id}
                className="group/row grid min-h-16 grid-cols-[240px_1fr] border-b last:border-b-0 hover:bg-accent/40"
              >
                <div className="min-w-0 border-r px-4 py-2.5">
                  <EventHoverCard
                    {...cardProps}
                    trigger={
                      <button
                        type="button"
                        className="block w-full truncate rounded-sm text-left text-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        {event.title}
                      </button>
                    }
                  />
                  <div className="mt-1.5">
                    <MoaiChips names={event.moais ?? []} moais={moais} />
                  </div>
                </div>

                {/* 经线为底,事件是穿过经线的纬线 */}
                <div className="relative bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px)] bg-[size:25%_100%]">
                  <EventHoverCard
                    {...cardProps}
                    trigger={
                      event.end_tick === null ? (
                        <button
                          type="button"
                          className="absolute top-1/2 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/40"
                          style={{
                            left: `clamp(14px, ${left}%, calc(100% - 14px))`,
                          }}
                          aria-label={event.title}
                        >
                          <span
                            aria-hidden="true"
                            className="block size-2.5 rotate-45 rounded-[2px]"
                            style={{
                              backgroundColor: dye,
                              boxShadow:
                                "inset 0 0 0 1px color-mix(in oklab, currentColor 25%, transparent)",
                            }}
                          />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="absolute top-1/2 flex h-7 min-w-2.5 -translate-y-1/2 items-center rounded-md px-1 outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/40"
                          style={{
                            left: `${left}%`,
                            width: `max(${width}%, 0.6%)`,
                          }}
                          aria-label={event.title}
                        >
                          <span
                            aria-hidden="true"
                            className="block h-2 w-full rounded-full transition-[height] group-hover/row:h-2.5"
                            style={{ backgroundColor: dye }}
                          />
                        </button>
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
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-2">
        <span
          className="h-2 w-5 rounded-full"
          style={{ backgroundColor: "var(--primary)" }}
        />{" "}
        {COPY[initialLanguage()].gantt_duration}
      </span>
      <span className="flex items-center gap-2">
        <span className="size-2.5 rotate-45 rounded-[2px] bg-primary" />
        {COPY[initialLanguage()].gantt_milestone}
      </span>
      <span className="ml-auto flex items-center gap-2">
        <DyeLegendInline />
        {COPY[initialLanguage()].gantt_dye}
      </span>
    </div>
  );
}

function DyeLegendInline() {
  return (
    <span aria-hidden="true" className="flex items-center gap-1">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <span
          key={n}
          className="h-2 w-2.5 rounded-full"
          style={{ backgroundColor: `var(--dye-${n})` }}
        />
      ))}
    </span>
  );
}
