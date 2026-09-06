"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <main className="flex-1 px-6 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{story.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {story.description && (
              <div className="prose prose-sm max-w-none text-muted-foreground">
                {story.description}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardDescription className="mb-1 flex items-center gap-2">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  {copy.story_calendar}
                </CardDescription>
                <CardTitle>{calendar.title}</CardTitle>
              </div>
              <Badge variant="secondary">
                {calendar.source === "builtin" ? copy.story_builtin : copy.story_plugin}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {calendar.description && (
              <p className="text-sm leading-6 text-muted-foreground">
                {calendar.description}
              </p>
            )}
            <dl className="grid gap-3 text-sm sm:grid-cols-[8rem_1fr]">
              <dt className="text-muted-foreground">{copy.story_mode}</dt>
              <dd className="font-mono text-xs">{calendar.name}</dd>
            </dl>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
