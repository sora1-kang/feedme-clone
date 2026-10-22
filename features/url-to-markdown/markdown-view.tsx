import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Card, CardContent } from "@/components/ui/card";

const PROSE = [
  "text-sm leading-7 wrap-anywhere break-keep",
  "[&_h1]:mt-8 [&_h1]:text-2xl [&_h1]:font-semibold",
  "[&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold",
  "[&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold",
  "[&_p]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1",
  "[&_a]:underline [&_a]:underline-offset-4",
  "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground",
  "[&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em]",
  "[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg",
  "[&_table]:w-full [&_table]:text-sm [&_th]:border [&_th]:bg-muted [&_th]:px-2.5 [&_th]:py-1.5 [&_th]:text-left [&_td]:border [&_td]:px-2.5 [&_td]:py-1.5",
  "[&>:first-child]:mt-0 [&>:last-child]:mb-0",
].join(" ");

export function MarkdownView({ markdown }: { markdown: string }) {
  return (
    <Card>
      <CardContent>
        <article aria-label="변환된 본문" className={PROSE}>
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
              table: ({ children }) => (
                <div className="my-4 overflow-x-auto">
                  <table>{children}</table>
                </div>
              ),
            }}
          >
            {markdown}
          </Markdown>
        </article>
      </CardContent>
    </Card>
  );
}
