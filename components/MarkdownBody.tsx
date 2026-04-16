import { renderMarkdown } from "@/lib/markdown";

export default function MarkdownBody({ body }: { body: string }) {
  const html = renderMarkdown(body);
  return <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />;
}
