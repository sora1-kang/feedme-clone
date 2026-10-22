import { ThemeToggle } from "@/components/theme-toggle";
import { UrlToMarkdown } from "@/features/url-to-markdown";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            URL을 Markdown으로
          </h1>
          <p className="text-sm text-muted-foreground break-keep">
            웹 페이지 주소를 붙여넣으면 본문만 Markdown으로 뽑아 드립니다.
          </p>
        </div>
        <ThemeToggle />
      </header>
      <UrlToMarkdown />
    </main>
  );
}
