/**
 * 軽量Markdownレンダラー（依存なし）
 * XSS対策: HTMLエンティティを先にエスケープしてからMarkdown変換
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderMarkdown(input: string): string {
  // 1. HTML escape
  let html = escapeHtml(input);

  // 2. Code blocks (```...```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) =>
    `<pre class="md-code-block"><code>${code.trim()}</code></pre>`
  );

  // 3. Inline code (`...`)
  html = html.replace(/`([^`\n]+)`/g, '<code class="md-code-inline">$1</code>');

  // 4. Headings (### → h3, ## → h2, # → h1)
  html = html.replace(/^### (.+)$/gm, '<h4 class="md-h4">$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3 class="md-h3">$1</h3>');
  html = html.replace(/^# (.+)$/gm, '<h2 class="md-h2">$1</h2>');

  // 5. Bold & italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // 6. Links [text](url)
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>'
  );

  // 7. Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="md-blockquote">$1</blockquote>');
  // merge adjacent blockquotes
  html = html.replace(/<\/blockquote>\n<blockquote class="md-blockquote">/g, "\n");

  // 8. Unordered lists
  html = html.replace(/^[-*] (.+)$/gm, '<li class="md-li">$1</li>');
  html = html.replace(/((?:<li class="md-li">.*<\/li>\n?)+)/g, '<ul class="md-ul">$1</ul>');

  // 9. Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="md-oli">$1</li>');
  html = html.replace(/((?:<li class="md-oli">.*<\/li>\n?)+)/g, '<ol class="md-ol">$1</ol>');

  // 10. Horizontal rule
  html = html.replace(/^---$/gm, '<hr class="md-hr" />');

  // 11. Line breaks: double newline → paragraph break, single → <br>
  html = html.replace(/\n\n/g, '</p><p class="md-p">');
  html = html.replace(/\n/g, "<br />");

  // Wrap in paragraph
  html = `<p class="md-p">${html}</p>`;

  // Clean up empty paragraphs around block elements
  html = html.replace(/<p class="md-p">(<(?:pre|h[234]|blockquote|ul|ol|hr)[^>]*>)/g, "$1");
  html = html.replace(/(<\/(?:pre|h[234]|blockquote|ul|ol)>)<\/p>/g, "$1");
  html = html.replace(/<p class="md-p"><\/p>/g, "");

  return html;
}
