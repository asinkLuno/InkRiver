"use client";

import { useDeferredValue, useState } from "react";
import type { Drift, Moai, MoaiMap } from "@/lib/api";
import { useCopy } from "@/lib/i18n";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DriftGantt, GanttLegend } from "../drift/gantt";
import { PageHeader } from "@/components/page-header";

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
  const copy = useCopy();
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
      <PageHeader
        title={copy.moai_title}
        meta={copy.moai_count.replace("{n}", String(filteredEntries.length)).replace("{t}", String(entries.length))}
      >
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.moai_search + "…"}
          aria-label={copy.moai_search}
          className="mt-4 h-9 w-full max-w-md rounded-md border border-input bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </PageHeader>

      {filteredEntries.length > 0 ? (
        <>
          <div className="space-y-10">
            {filteredEntries.map(({ key, moai, events }) => (
              <Card key={key} id={key} className="scroll-mt-20 gap-0 py-0">
                <CardHeader className="gap-3 border-b py-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-xl">{moai.name}</CardTitle>
                      {moai.description && (
                        <CardDescription className="mt-2 max-w-4xl font-display text-[0.95rem] leading-7 whitespace-pre-wrap">
                          {moai.description}
                        </CardDescription>
                      )}
                    </div>
                    {moai.base_time_display && (
                      <div className="shrink-0 self-start rounded-sm bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground">
                        {moai.base_time_display}
                      </div>
                    )}
                  </div>

                  {(moai.materials?.length ||
                    Object.keys(moai.extra_props ?? {}).length > 0) && (
                    <div className="grid gap-4 pt-1 md:grid-cols-2">
                      {moai.materials && moai.materials.length > 0 && (
                        <div>
                          <h3 className="mb-2 text-xs font-medium text-muted-foreground">
                            {copy.moai_materials}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {moai.materials.map((material) => (
                              <span
                                key={material}
                                className="rounded-sm border bg-background px-2 py-0.5 text-xs"
                              >
                                {material}
                              </span>
                            ))}
                          </div>
                        </div>
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
                </CardHeader>

                <CardContent className="px-4 py-5 sm:px-5">
                  <div className="mb-3 flex items-baseline justify-between gap-3">
                    <h3 className="font-medium">{copy.moai_timeline}</h3>
                    <span className="text-xs text-muted-foreground">
                      {copy[events.length === 1 ? "moai_event_count" : "moai_event_count_plural"].replace("{n}", String(events.length))}
                    </span>
                  </div>
                  {events.length > 0 ? (
                    <DriftGantt
                      driftKey={key}
                      events={events}
                      moais={moais}
                      showHeader={false}
                    />
                  ) : (
                    <div className="rounded-lg border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
                      {copy.moai_events_empty}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <GanttLegend />
        </>
      ) : (
        <div className="rounded-lg border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
          {copy.moai_search_empty.replace("{q}", query.trim())}
        </div>
      )}
    </>
  );
}
