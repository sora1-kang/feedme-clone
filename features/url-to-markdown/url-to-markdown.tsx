"use client";

import { useRef, useState, type FormEvent } from "react";
import { ArrowRightIcon, CircleAlertIcon, XIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

import type { ConvertedPage } from "./convert";
import { ExportPanel } from "./export-panel";
import { MarkdownView } from "./markdown-view";
import { validateUrl } from "./url";

type Phase =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "result"; page: ConvertedPage }
  | { kind: "error"; title: string; text: string };

const CONNECTION_ERROR = {
  title: "변환하지 못했습니다",
  text: "서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
};

async function requestConversion(url: string): Promise<Phase> {
  try {
    const response = await fetch("/api/convert", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const body = await response.json();
    if (response.ok) return { kind: "result", page: body };
    return { kind: "error", title: body.error.title, text: body.error.text };
  } catch {
    return { kind: "error", ...CONNECTION_ERROR };
  }
}

export function UrlToMarkdown() {
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  // 지우기 뒤에 도착한 이전 응답이 화면을 되살리지 않도록 요청마다 번호를 매긴다.
  const requestId = useRef(0);
  const busy = useRef(false);

  const loading = phase.kind === "loading";

  async function convert(event: FormEvent) {
    event.preventDefault();
    if (busy.current) return;

    const check = validateUrl(url);
    if (!check.ok) {
      setPhase({ kind: "error", title: check.title, text: check.text });
      return;
    }

    const id = ++requestId.current;
    busy.current = true;
    setPhase({ kind: "loading" });
    const next = await requestConversion(check.url);
    if (id === requestId.current) {
      busy.current = false;
      setPhase(next);
    }
  }

  function clear() {
    requestId.current++;
    busy.current = false;
    setUrl("");
    setPhase({ kind: "idle" });
  }

  const error = phase.kind === "error" ? phase : null;

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardContent>
          <form onSubmit={convert} noValidate className="flex flex-col gap-3">
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="page-url">페이지 주소</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="page-url"
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  placeholder="https://example.com/article"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  aria-invalid={error ? true : undefined}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={loading}
                  aria-label={loading ? "변환 중" : "변환하기"}
                  title={loading ? "변환 중" : "변환하기"}
                >
                  {loading ? <Spinner /> : <ArrowRightIcon />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={clear}
                  aria-label="지우기"
                  title="지우기"
                >
                  <XIcon />
                </Button>
              </div>
            </Field>
            {error && (
              <Alert variant="destructive">
                <CircleAlertIcon />
                <AlertTitle>{error.title}</AlertTitle>
                <AlertDescription>{error.text}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>

      {loading && (
        <Card aria-busy="true" aria-label="변환 중">
          <CardContent className="flex flex-col gap-4">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/5" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      )}

      {phase.kind === "result" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle
                role="heading"
                aria-level={2}
                className="text-2xl leading-snug font-bold text-balance break-keep"
              >
                {phase.page.title}
              </CardTitle>
              {phase.page.author && <CardDescription>{phase.page.author}</CardDescription>}
            </CardHeader>
            <CardContent>
              <ExportPanel page={phase.page} />
            </CardContent>
          </Card>
          <MarkdownView markdown={phase.page.markdown} />
        </>
      )}
    </div>
  );
}
