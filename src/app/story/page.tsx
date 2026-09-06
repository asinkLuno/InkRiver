"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageError, PageLoading } from "@/components/page-state";
import { useCopy } from "@/lib/i18n";
import {
  getCalendarMetadata,
  getStory,
  onRefetch,
  type CalendarMetadata,
  type Story,
} from "@/lib/api";

export default function StoryPage() {
  const [data, setData] = useState<{
    story: Story;
    calendar: CalendarMetadata;
  } | null>(null);
  const [error, setError] = useState<unknown>(null);
  const copy = useCopy();

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      Promise.all([getStory(), getCalendarMetadata()])
        .then(([story, calendar]) => {
          if (!cancelled) {
            setError(null);
            setData({ story, calendar });
          }
        })
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
    return <PageError title={copy.error_load_story} error={error} />;
  if (!data) return <PageLoading />;

  const { story, calendar } = data;

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <header className="text-center">
          <h1 className="font-display text-3xl font-medium tracking-tight">
            {story.title}
          </h1>
          {story.description && (
            <p className="prose-book mx-auto mt-5 max-w-prose text-muted-foreground">
              {story.description}
            </p>
          )}
        </header>

        <section
          aria-labelledby="story-calendar-heading"
          className="mt-12 rounded-xl border bg-card px-6 py-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                {copy.story_calendar}
              </p>
              <h2
                id="story-calendar-heading"
                className="mt-1 font-display text-lg font-medium"
              >
                {calendar.title}
              </h2>
            </div>
            <Badge variant="secondary">
              {calendar.source === "builtin" ? copy.story_builtin : copy.story_plugin}
            </Badge>
          </div>
          {calendar.description && (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {calendar.description}
            </p>
          )}
          <dl className="mt-4 grid gap-3 border-t pt-4 text-sm sm:grid-cols-[8rem_1fr]">
            <dt className="text-muted-foreground">{copy.story_mode}</dt>
            <dd className="font-mono text-xs leading-5">{calendar.name}</dd>
          </dl>
        </section>
      </div>
    </main>
  );
}
