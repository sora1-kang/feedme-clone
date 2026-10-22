"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, DownloadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { aiChatUrl, markdownFileName, type AiService } from "./export";
import type { ConvertedPage } from "./convert";

const PRESETS = ["요약해줘", "한국어로 번역해줘", "쉽게 설명해줘"];
const CUSTOM = "직접 입력";
const AI_LABEL: Record<AiService, string> = { chatgpt: "ChatGPT", claude: "Claude" };

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ExportPanel({ page }: { page: ConvertedPage }) {
  const [choice, setChoice] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState("");

  const prompt = choice === CUSTOM ? custom.trim() : (choice ?? "");

  async function copy() {
    setStatus("");
    if (await copyToClipboard(page.markdown)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setStatus("복사하지 못했습니다. 브라우저의 클립보드 권한을 확인해 주세요.");
    }
  }

  function download() {
    const name = markdownFileName(page.title);
    const url = URL.createObjectURL(
      new Blob([page.markdown], { type: "text/markdown;charset=utf-8" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
    setStatus(`${name} 파일을 내려받았습니다.`);
  }

  async function openAi(service: AiService) {
    const label = AI_LABEL[service];
    if (!(await copyToClipboard(page.markdown))) {
      setStatus("복사하지 못했습니다. 브라우저의 클립보드 권한을 확인해 주세요.");
      return;
    }
    window.open(aiChatUrl(service, prompt), "_blank", "noopener,noreferrer");
    setStatus(
      `본문을 클립보드에 복사하고 ${label} 새 대화를 열었습니다. ` +
        (prompt
          ? `프롬프트(“${prompt}”)가 입력창에 채워져 있으니 붙여넣기만 하세요.`
          : "입력창에서 붙여넣기만 하세요.")
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Separator />
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Button onClick={copy}>
          {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
          {copied ? "복사했습니다" : "복사하기"}
        </Button>
        <Button variant="outline" onClick={download}>
          <DownloadIcon data-icon="inline-start" />
          .md 다운로드
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <p id="prompt-label" className="text-sm font-medium text-muted-foreground">
          AI에 보낼 때 앞에 붙일 프롬프트 (선택)
        </p>
        <ToggleGroup
          aria-labelledby="prompt-label"
          variant="outline"
          spacing={2}
          className="flex-wrap"
          value={choice ? [choice] : []}
          onValueChange={(next) => setChoice(next[0] ?? null)}
        >
          {[...PRESETS, CUSTOM].map((name) => (
            <ToggleGroupItem key={name} value={name}>
              {name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {choice === CUSTOM && (
          <Input
            aria-label="직접 입력한 프롬프트"
            placeholder="예: 핵심만 세 줄로 정리해줘"
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            autoFocus
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Button variant="outline" onClick={() => openAi("chatgpt")}>
          ChatGPT로 열기
        </Button>
        <Button variant="outline" onClick={() => openAi("claude")}>
          Claude로 열기
        </Button>
      </div>
      <p role="status" className="min-h-5 text-sm text-muted-foreground">
        {status}
      </p>
    </div>
  );
}
