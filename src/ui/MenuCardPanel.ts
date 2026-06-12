import { RestaurantService } from "../services/RestaurantService";
import { el, clearChildren, formatEuro, euroToCents, ChangeCallback } from "./utils";

export class MenuCardPanel {
  private container: HTMLElement;
  private isOpen = false;
  public onChange: ChangeCallback | null = null;

  constructor(
    private restaurantService: RestaurantService,
    private restaurantId: string,
  ) {
    this.container = el("div", {
      class:
        "fixed inset-0 z-50 pointer-events-none transition-opacity duration-300 opacity-0",
      id: "menu-panel-overlay",
    });

    const backdrop = el("div", {
      class:
        "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity",
      id: "menu-backdrop",
    });
    backdrop.addEventListener("click", () => this.close());

    const panel = el("aside", {
      class:
        "absolute right-0 top-0 bottom-0 bg-neutral-900 border-l border-neutral-800 transition-all duration-300 ease-out flex flex-col",
      id: "menu-panel",
    });

    const header = el("div", { class: "p-6 border-b border-neutral-800/80 flex items-center justify-between" });
    const titleGroup = el("div", {});
    const title = el("h2", { class: "text-xl font-bold text-amber-400 tracking-wide font-display" }, "Speisekarte");
    const subtitle = el("p", { class: "text-[10px] uppercase tracking-[0.2em] text-neutral-500 mt-1 font-display" }, "Fachkenntnis · Autocompletion");
    titleGroup.appendChild(title);
    titleGroup.appendChild(subtitle);

    const closeBtn = el("button", {
      class: "text-neutral-400 hover:text-white transition-colors text-2xl leading-none cursor-pointer w-10 h-10 flex items-center justify-center rounded-lg hover:bg-neutral-800",
    }, "×");
    closeBtn.addEventListener("click", () => this.close());

    header.appendChild(titleGroup);
    header.appendChild(closeBtn);

    const addForm = this.buildAddForm();
    const listContainer = el("div", {
      class: "flex-1 overflow-y-auto p-6",
      id: "menu-card-list",
    });

    panel.appendChild(header);
    panel.appendChild(addForm);
    panel.appendChild(listContainer);
    this.container.appendChild(backdrop);
    this.container.appendChild(panel);

    panel.style.translate = "100% 0";
  }

  private buildAddForm(): HTMLElement {
    const form = el("div", { class: "p-6 border-b border-neutral-800/80" });
    const label = el("p", { class: "text-[10px] text-neutral-500 uppercase tracking-[0.2em] mb-3 font-display" }, "Neues Gericht");
    form.appendChild(label);

    const row = el("div", { class: "flex gap-2" });
    const nrInput = el("input", {
      type: "text",
      inputmode: "numeric",
      placeholder: "Nr.",
      autocomplete: "off",
      class:
        "w-16 px-2 py-2.5 text-sm bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none transition-all font-mono text-center",
      id: "menu-add-nr",
    });
    const nameInput = el("input", {
      type: "text",
      placeholder: "Gerichtname",
      autocomplete: "off",
      class:
        "flex-1 px-3 py-2.5 text-sm bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none transition-all",
      id: "menu-add-name",
    });
    const variantInput = el("input", {
      type: "text",
      placeholder: "Variante",
      autocomplete: "off",
      class:
        "w-24 px-3 py-2.5 text-sm bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none transition-all",
      id: "menu-add-variant",
    });
    const priceInput = el("input", {
      type: "text",
      inputmode: "decimal",
      placeholder: "Preis",
      autocomplete: "off",
      class:
        "w-24 px-2 py-2.5 text-sm bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none transition-all font-mono",
      id: "menu-add-price",
    });
    const addBtn = el("button", {
      class:
        "px-4 py-2.5 bg-amber-500 text-neutral-900 text-sm font-bold rounded-lg hover:bg-amber-400 active:scale-95 transition-all cursor-pointer shrink-0 font-display",
    }, "+");

    addBtn.addEventListener("click", () => {
      const nr = parseInt((nrInput as HTMLInputElement).value, 10);
      const name = (nameInput as HTMLInputElement).value.trim();
      const variant = (variantInput as HTMLInputElement).value.trim() || "default";
      const price = euroToCents((priceInput as HTMLInputElement).value);
      if (!nr || !name || price <= 0) return;
      this.restaurantService.addOrUpdateMenuItem(this.restaurantId, nr, name, variant, price);
      (nrInput as HTMLInputElement).value = "";
      (nameInput as HTMLInputElement).value = "";
      (variantInput as HTMLInputElement).value = "";
      (priceInput as HTMLInputElement).value = "";
      this.renderList();
      if (this.onChange) this.onChange();
    });

    priceInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        (addBtn as HTMLButtonElement).click();
        e.preventDefault();
      }
    });

    row.appendChild(nrInput);
    row.appendChild(nameInput);
    row.appendChild(variantInput);
    row.appendChild(priceInput);
    row.appendChild(addBtn);
    form.appendChild(row);
    return form;
  }

  private renderList(): void {
    const container = this.container.querySelector("#menu-card-list") as HTMLElement;
    if (!container) return;
    clearChildren(container);

    const restaurant = this.restaurantService.getById(this.restaurantId);
    if (!restaurant) return;

    const items = [...restaurant.menuItems.values()].sort((a, b) => a.menuNumber - b.menuNumber);

    if (items.length === 0) {
      const empty = el("div", { class: "text-center py-12" });
      const emptyIcon = el("p", { class: "text-3xl mb-3 opacity-20" }, "📋");
      const emptyText = el("p", { class: "text-neutral-500 text-sm italic" }, "Noch keine Gerichte eingetragen …");
      const emptySub = el("p", { class: "text-neutral-700 text-xs mt-2" }, "Gerichte werden automatisch hinzugefügt, wenn jemand bestellt.");
      empty.appendChild(emptyIcon);
      empty.appendChild(emptyText);
      empty.appendChild(emptySub);
      container.appendChild(empty);
      return;
    }

    const table = el("div", { class: "divide-y divide-neutral-800/60" });

    for (const item of items) {
      const row = el("div", { class: "flex items-center gap-3 py-3 group" });
      const nrBadge = el("span", {
        class:
          "inline-flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-800 text-amber-400 text-xs font-mono font-bold shrink-0 border border-neutral-700/50",
      }, String(item.menuNumber));
      const nameSpan = el("span", { class: "flex-1 text-sm text-neutral-200" }, item.name);
      const variantsContainer = el("div", { class: "text-right" });
      for (const [name, price] of item.variants) {
        const variantSpan = el("span", { class: "block text-xs text-neutral-400 font-mono tabular-nums" }, `${name}: ${formatEuro(price)}`);
        variantsContainer.appendChild(variantSpan);
      }
      const delBtn = el("button", {
        class:
          "text-neutral-600 hover:text-red-400 transition-colors text-sm opacity-0 group-hover:opacity-100 cursor-pointer p-1.5 rounded hover:bg-neutral-800",
        title: "Entfernen",
      }, "✕");
      delBtn.addEventListener("click", () => {
        this.restaurantService.removeMenuItem(this.restaurantId, item.menuNumber);
        this.renderList();
        if (this.onChange) this.onChange();
      });

      row.appendChild(nrBadge);
      row.appendChild(nameSpan);
      row.appendChild(variantsContainer);
      row.appendChild(delBtn);
      table.appendChild(row);
    }

    container.appendChild(table);
  }

  open(): void {
    this.isOpen = true;
    this.container.style.opacity = "1";
    this.container.style.pointerEvents = "auto";
    const backdrop = this.container.querySelector("#menu-backdrop") as HTMLElement;
    if (backdrop) backdrop.style.pointerEvents = "auto";
    const panel = this.container.querySelector("#menu-panel") as HTMLElement;
    if (panel) panel.style.translate = "0 0";
    this.renderList();
  }

  close(): void {
    this.isOpen = false;
    this.container.style.opacity = "0";
    this.container.style.pointerEvents = "none";
    const backdrop = this.container.querySelector("#menu-backdrop") as HTMLElement;
    if (backdrop) backdrop.style.pointerEvents = "none";
    const panel = this.container.querySelector("#menu-panel") as HTMLElement;
    if (panel) panel.style.translate = "100% 0";
  }

  toggle(): void {
    if (this.isOpen) this.close();
    else this.open();
  }

  setRestaurant(id: string): void {
    this.restaurantId = id;
  }

  render(): HTMLElement {
    return this.container;
  }
}