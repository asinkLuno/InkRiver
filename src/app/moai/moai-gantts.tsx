"use client";

import { useDeferredValue, useState } from "react";
import type { Drift, Moai, MoaiMap } from "@/lib/api";
import { COPY, initialLanguage } from "@/lib/i18n";
import { dyeVar } from "@/lib/palette";
import { DriftGantt, GanttLegend } from "../drift/gantt";

export type MoaiGanttEntry = {
  key: string;
  moai: Moai;
  events: Drift[];
};

function displayValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null) return "null";
  if (value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export function MoaiGantts({
  entries,
  moais,
}: {
  entries: MoaiGanttEntry[];
  moais: MoaiMap;
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLocaleLowerCase();
  const filteredEntries = normalizedQuery
    ? entries.filter(({ key, moai }) =>
        [
          key,
          moai.name,
          moai.description,
          ...(moai.materials ?? []),
          ...Object.entries(moai.extra_props ?? {}).flatMap(([name, value]) => [
            name,
            displayValue(value),
          ]),
        ]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLocaleLowerCase().includes(normalizedQuery)),
      )
    : entries;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">
            {COPY[initialLanguage()].moai_title}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground tnum">
            {COPY[initialLanguage()].moai_count
              .replace("{n}", String(filteredEntries.length))
              .replace("{t}", String(entries.length))}
          </p>
        </div>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={COPY[initialLanguage()].moai_search + "…"}
          aria-label={COPY[initialLanguage()].moai_search}
          className="h-9 w-full max-w-xs rounded-md border border-input bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </div>

      {filteredEntries.length > 0 ? (
        <>
          <div className="mt-8 space-y-12">
            {filteredEntries.map(({ key, moai, events }) => {
              const dye = dyeVar(moai.name || key, moais);
              return (
                <section key={key} id={key} className="scroll-mt-6">
                  <div className="grid grid-cols-[3px_minmax(0,1fr)] gap-x-5">
                    <div
                      aria-hidden="true"
                      className="rounded-full bg-muted"
                      style={{ backgroundColor: dye }}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <h2 className="text-xl font-semibold">{moai.name}</h2>
                        {moai.base_time_display && (
                          <span className="text-xs text-muted-foreground tnum">
                            {moai.base_time_display}
                          </span>
                        )}
                      </div>
                      {moai.description && (
                        <p className="mt-2 max-w-[72ch] text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
                          {moai.description}
                        </p>
                      )}

                      {(moai.materials?.length ||
                        Object.keys(moai.extra_props ?? {}).length > 0) && (
                        <div className="mt-4 grid gap-4 border-t pt-4 md:grid-cols-2">
                          {moai.materials && moai.materials.length > 0 && (
                            <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-2 text-xs">
                              <dt className="font-medium text-muted-foreground">
                                {COPY[initialLanguage()].moai_materials}
                              </dt>
                              <dd className="min-w-0">
                                <span className="flex flex-wrap gap-1.5">
                                  {moai.materials.map((material) => (
                                    <span
                                      key={material}
                                      className="rounded-full border bg-card px-2 py-0.5 text-muted-foreground"
                                    >
                                      {material}
                                    </span>
                                  ))}
                                </span>
                              </dd>
                            </dl>
                          )}
                          {Object.keys(moai.extra_props ?? {}).length > 0 && (
                            <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-2 text-xs">
                              {Object.entries(moai.extra_props ?? {}).map(
                                ([name, value]) => (
                                  <div key={name} className="contents">
                                    <dt className="font-medium text-muted-foreground">
                                      {name}
                                    </dt>
                                    <dd className="min-w-0 whitespace-pre-wrap break-words">
                                      {displayValue(value)}
                                    </dd>
                                  </div>
                                ),
                              )}
                            </dl>
                          )}
                        </div>
                      )}

                      <div className="mt-5">
                        {events.length > 0 ? (
                          <DriftGantt
                            driftKey={key}
                            events={events}
                            moais={moais}
                            showHeader={false}
                          />
                        ) : (
                          <p className="rounded-lg border border-dashed px-6 py-8 text-center text-sm text-muted-foreground">
                            {COPY[initialLanguage()].moai_events_empty}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
          <GanttLegend />
        </>
      ) : (
        <p className="mt-8 rounded-lg border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
          {COPY[initialLanguage()].moai_search_empty.replace(
            "{q}",
            query.trim(),
          )}
        </p>
      )}
    </>
  );
}
