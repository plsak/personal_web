/**
 * Strips inline text-align styles from an HTML string.
 *
 * Inline styles stored in rich-text content (e.g. `style="text-align: justify"`) always
 * override external CSS rules, even when marked `!important`. This helper removes any
 * text-align declaration from every inline `style` attribute so that the component's own
 * CSS alignment classes take precedence at render time.
 *
 * Usage:
 *   dangerouslySetInnerHTML={{ __html: stripInlineTextAlign(html) }}
 */
export function stripInlineTextAlign(html: string): string {
  if (!html) return html;

  // Use a DOM-based approach so we walk every element in the tree.
  // This is immune to regex edge-cases (no-space variants, single-quotes,
  // nested elements, multiple declarations in one style attribute, etc.).
  try {
    const doc = new DOMParser().parseFromString(
      `<body>${html}</body>`,
      "text/html",
    );
    const body = doc.body;
    // Walk every element including body itself
    const allElements: HTMLElement[] = [
      body,
      ...Array.from(body.querySelectorAll<HTMLElement>("*")),
    ];
    for (const el of allElements) {
      el.style.removeProperty("text-align");
      el.style.removeProperty("word-spacing");
      el.style.removeProperty("word-wrap");
      el.style.removeProperty("letter-spacing");
      // If the style attribute is now empty, remove it entirely
      if (!el.getAttribute("style")?.trim()) {
        el.removeAttribute("style");
      }
    }
    return body.innerHTML;
  } catch {
    // DOMParser unavailable (SSR/test env) — fall back to the regex approach
    // but with a more comprehensive pattern this time.
    return html
      .replace(
        /(<[^>]+style\s*=\s*["'][^"']*?)\btext-align\s*:\s*[^;"']+;?/gi,
        "$1",
      )
      .replace(
        /(<[^>]+style\s*=\s*["'][^"']*?)\bword-spacing\s*:\s*[^;"']+;?/gi,
        "$1",
      )
      .replace(
        /(<[^>]+style\s*=\s*["'][^"']*?)\bletter-spacing\s*:\s*[^;"']+;?/gi,
        "$1",
      )
      .replace(/\s*style\s*=\s*["']\s*["']/gi, "");
  }
}
