"use client";

import { useEffect, useState } from "react";
import { PageError, PageLoading } from "@/components/page-state";
import { useCopy } from "@/lib/i18n";
import {
  getDrifts,
  getMoais,
  onRefetch,
  type DriftMap,
  type MoaiMap,
} from "@/lib/api";
import { compareDriftTime, DriftGantt, GanttLegend } from "./gantt";
import { PageHeader } from "@/components/page-header";

export default function DriftPage() {
  const [data, setData] = useState<{
    driftsRaw: DriftMap;
    moais: MoaiMap;
  } | null>(null);
  const [error, setError] = useState<unknown>(null);
  const copy = useCopy();

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      Promise.all([getDrifts(), getMoais()])
        .then(
          ([driftsRaw, moais]) => {
            if (!cancelled) {
              setError(null);
              setData({ driftsRaw, moais });
            }
          },
        )
        .catch((err) => !cancelled && setError(err));
    };
    load();
    const off = onRefetch(load);
    return () => {
      cancelled = true;
      off();
    };
  }, []);

  if (error)
    return <PageError title={copy.error_load_drift} error={error} />;
  if (!data) return <PageLoading />;

  const { driftsRaw, moais } = data;
  const entries = Object.entries(driftsRaw)
    .map(([key, events]) => ({
      key,
      events: events.toSorted(compareDriftTime),
    }))
    .filter(({ events }) => events.length > 0);
  const events = entries.flatMap(({ events }) => events);

  if (events.length === 0) {
    return (
      <main className="flex flex-1 items-center justify-center text-muted-foreground">
        <p>{copy.drift_empty}</p>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          title={copy.drift_title}
          meta={copy.drift_count.replace("{n}", String(events.length)).replace("{s}", String(entries.length))}
        />

        <div className="space-y-8">
          {entries.map(({ key, events: driftEvents }) => (
            <DriftGantt
              key={key}
              driftKey={key}
              events={driftEvents}
              moais={moais}
            />
          ))}
        </div>

        <GanttLegend />
      </div>
    </main>
  );
}
