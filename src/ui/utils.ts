export function formatEuro(cents: number): string {
  const abs = Math.abs(cents);
  const euros = Math.floor(abs / 100);
  const c = abs % 100;
  const sign = cents < 0 ? "−" : "";
  return `${sign}${euros},${String(c).padStart(2, "0")} €`;
}

export function euroToCents(euro: string): number {
  const cleaned = euro.replace(/[^0-9.,]/g, "").replace(",", ".");
  const val = parseFloat(cleaned);
  if (isNaN(val)) return 0;
  return Math.round(val * 100);
}

export function centsToInputValue(cents: number): string {
  const euros = cents / 100;
  return euros.toFixed(2).replace(".", ",");
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string>,
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (attrs) {
    for (const [key, val] of Object.entries(attrs)) {
      element.setAttribute(key, val);
    }
  }
  for (const child of children) {
    if (typeof child === "string") {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  }
  return element;
}

export function clearChildren(parent: HTMLElement): void {
  while (parent.firstChild) parent.removeChild(parent.firstChild);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export type ChangeCallback = () => void;