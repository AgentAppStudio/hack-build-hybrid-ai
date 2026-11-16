/**
 * Safe HTML rendering utility following modern-web-guidance `sanitize-untrusted-html`.
 * Uses the native Sanitizer API (`Element.prototype.setHTML`) when available,
 * with a strict allowlist DOM parser fallback that strips scripts, inline event handlers,
 * aria-*, data-*, and disallowed element content.
 */
const ALLOWED_ELEMENTS = [
  "div",
  "section",
  "main",
  "article",
  "h1",
  "h2",
  "h3",
  "h4",
  "p",
  "span",
  "small",
  "strong",
  "em",
  "b",
  "i",
  "label",
  "input",
  "button",
  "form",
  "a",
  "textarea",
];

const ALLOWED_ATTRIBUTES = [
  "class",
  "type",
  "checked",
  "name",
  "value",
  "placeholder",
  "action",
  "method",
  "href",
  "style",
];

export function renderSanitizedHtml(
  container: HTMLElement | null,
  untrustedHtml: string
): void {
  if (!container) return;

  if ("setHTML" in Element.prototype) {
    (
      container as HTMLElement & {
        setHTML: (
          html: string,
          options?: {
            sanitizer?: { elements?: string[]; attributes?: string[] };
          }
        ) => void;
      }
    ).setHTML(untrustedHtml, {
      sanitizer: {
        elements: ALLOWED_ELEMENTS,
        attributes: ALLOWED_ATTRIBUTES,
      },
    });
    return;
  }

  // Fallback for browsers without native Element.prototype.setHTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(untrustedHtml, "text/html");
  const allowedSet = new Set(ALLOWED_ELEMENTS.map((e) => e.toUpperCase()));
  const allowedAttrSet = new Set(ALLOWED_ATTRIBUTES.map((a) => a.toLowerCase()));

  function cleanNode(node: Node): Node | null {
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(node.textContent || "");
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }
    const el = node as Element;
    if (!allowedSet.has(el.tagName.toUpperCase())) {
      // Match native Sanitizer API: remove disallowed elements together with their content
      return null;
    }
    const copy = document.createElement(el.tagName.toLowerCase());
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (
        allowedAttrSet.has(name) &&
        !name.startsWith("on") &&
        !name.startsWith("aria-") &&
        !name.startsWith("data-")
      ) {
        if (
          (name === "href" || name === "action") &&
          /^\s*javascript:/i.test(attr.value)
        ) {
          continue;
        }
        copy.setAttribute(name, attr.value);
      }
    }
    for (const child of Array.from(el.childNodes)) {
      const cleanedChild = cleanNode(child);
      if (cleanedChild) {
        copy.appendChild(cleanedChild);
      }
    }
    return copy;
  }

  const fragment = document.createDocumentFragment();
  for (const child of Array.from(doc.body.childNodes)) {
    const cleaned = cleanNode(child);
    if (cleaned) {
      fragment.appendChild(cleaned);
    }
  }
  container.replaceChildren(fragment);
}
