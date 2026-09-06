"use client";

import { useEffect, useState } from "react";
import { PageError, PageLoading } from "@/components/page-state";
import { useCopy } from "@/lib/i18n";
import {
  getMoais,
  getNarratives,
  onRefetch,
  type MoaiMap,
  type NarrativeMap,
} from "@/lib/api";
import { compareDriftTime, DriftGantt, GanttLegend } from "../drift/gantt";
import { PageHeader } from "@/components/page-header";

export default function NarrativePage() {
  const [data, setData] = useState<{
    narratives: NarrativeMap;
    moais: MoaiMap;
  } | null>(null);
  const [error, setError] = useState<unknown>(null);
  const copy = useCopy();

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      Promise.all([getNarratives(), getMoais()])
        .then(
          ([narratives, moais]) => {
            if (!cancelled) {
              setError(null);
              setData({ narratives, moais });
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

  if (error) {
    return <PageError title={copy.error_load_narrative} error={error} />;
  }
  if (!data) return <PageLoading />;

  const { narratives, moais } = data;
  const entries = Object.entries(narratives)
    .map(([name, narrative]) => ({
      name,
      narrative,
      events: narrative.drifts.toSorted(compareDriftTime),
    }))
    .filter(({ events }) => events.length > 0);
  const eventCount = entries.reduce(
    (total, entry) => total + entry.events.length,
    0,
  );

  if (entries.length === 0) {
    return (
      <main className="flex flex-1 items-center justify-center text-muted-foreground">
        <p>{copy.narrative_empty}</p>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          title={copy.narrative_title}
          meta={copy.narrative_count.replace("{n}", String(eventCount)).replace("{s}", String(entries.length))}
        />

        <div className="space-y-8">
          {entries.map(({ name, narrative, events }) => (
            <DriftGantt
              key={name}
              driftKey={name}
              events={events}
              moais={moais}
              description={copy.narrative_observer.replace("{o}", narrative.observer).replace("{t}", narrative.subject.join(" · "))}
            />
          ))}
        </div>

        <GanttLegend />
      </div>
    </main>
  );
}
