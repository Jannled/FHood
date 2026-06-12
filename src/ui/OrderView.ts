import { RestaurantService } from "../services/RestaurantService";
import { OrderService, formatOrderSheetDate } from "../services/OrderService";
import { Order } from "../models/Order";
import { OrderSheet, SortMode } from "../models/OrderSheet";
import { el, clearChildren, formatEuro, centsToInputValue, euroToCents, ChangeCallback } from "./utils";
import { MenuCardPanel } from "./MenuCardPanel";

export class OrderView {
  private container: HTMLElement;
  public onChange: ChangeCallback | null = null;

  private menuPanel: MenuCardPanel;
  private editingPerson: string | null = null;
  private sortMode: SortMode = "default";

  constructor(
    private restaurantService: RestaurantService,
    private orderService: OrderService,
    private restaurantId: string,
  ) {
    this.menuPanel = new MenuCardPanel(restaurantService, restaurantId);
    this.menuPanel.onChange = () => this.renderTable();

    this.container = el("div", { class: "max-w-6xl mx-auto px-4 sm:px-6 py-8" });
  }

  setRestaurant(id: string): void {
    this.restaurantId = id;
    this.menuPanel.setRestaurant(id);
    this.editingPerson = null;
  }

  render(): HTMLElement {
    clearChildren(this.container);

    const restaurant = this.restaurantService.getById(this.restaurantId);
    const sheet = this.orderService.getCurrentSheet();

    const headerRow = el("div", { class: "flex items-baseline justify-between mb-10 animate-in" });
    const weekLabel = el("div");
    const weekTitle = el("div", { class: "text-[11px] text-neutral-500 uppercase tracking-[0.25em] mb-1.5 font-display" }, "Tageskost · Bestellungen");
    
    const dateContainer = el("div", { class: "flex items-center gap-2 text-sm text-neutral-400 font-mono tabular-nums" });
    
    const prevBtn = el("button", {
      class: "hover:text-white transition-colors cursor-pointer p-1 rounded hover:bg-neutral-800",
      title: "Vorherige Bestellung",
    }, "←");
    prevBtn.addEventListener("click", () => {
      const prev = this.orderService.previousOrder();
      this.render();
    });

    const weekDate = el("p", { class: "text-sm text-neutral-400 font-mono tabular-nums" }, formatOrderSheetDate(sheet?.date));
    
    const nextBtn = el("button", {
      class: "hover:text-white transition-colors cursor-pointer p-1 rounded hover:bg-neutral-800",
      title: "Nächste Bestellung",
    }, "→");
    nextBtn.addEventListener("click", () => {
      const next = this.orderService.nextOrder();
      this.render();
    });

    dateContainer.appendChild(prevBtn);
    dateContainer.appendChild(weekDate);
    dateContainer.appendChild(nextBtn);

    weekLabel.appendChild(weekTitle);
    weekLabel.appendChild(dateContainer);


    const headerActions = el("div", { class: "flex items-center gap-3" });
    const menuBtn = el("button", {
      class:
        "text-sm text-amber-400 hover:text-amber-300 transition-all cursor-pointer border border-amber-400/30 px-3.5 py-2 rounded-lg hover:bg-amber-400/10 hover:border-amber-400/50 font-medium",
    }, " Speisekarte");
    menuBtn.addEventListener("click", () => this.menuPanel.open());

    const resetBtn = el("button", {
      class:
        "text-sm text-neutral-500 hover:text-red-400 transition-all cursor-pointer border border-neutral-700 px-3.5 py-2 rounded-lg hover:border-red-400/30 font-medium",
      title: "Neue Bestellung anlegen",
    }, "Neue Bestellung");
    resetBtn.addEventListener("click", () => {
      if (confirm("Neue Bestellung anlegen?")) {
        this.orderService.createNewOrderSheet(this.restaurantId);
        this.editingPerson = null;
        this.render();
      }
    });

    const qrBtn = el("button", {
      class: "p-2 rounded-lg border border-neutral-700 text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer",
      title: "Teilen",
    }, " QRCode");
    qrBtn.addEventListener("click", () => {
      const sheet = this.orderService.getCurrentSheet();
      const restaurant = this.restaurantService.getById(this.restaurantId);
      if (!sheet || !restaurant) return;

      const importData = JSON.stringify({
        restaurant: restaurant.toJSON(),
        order: sheet.toJSON(),
      });
      const url = `${window.location.origin}${window.location.pathname}?import=${encodeURIComponent(importData)}`;
      
      const popup = el("div", { class: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" });
      const card = el("div", { class: "bg-neutral-900 border border-neutral-800 p-8 rounded-2xl w-fit text-center shadow-2xl" });
      
      const title = el("p", { class: "text-white font-medium mb-4 font-display" }, "Bestellung teilen");
      const qrContainer = el("div", { class: "w-fit h-fit mx-auto bg-white p-2 rounded-lg mb-4 flex items-center justify-center" });
      const qrCanvas = el("canvas", { class: "size-fit" });
      qrContainer.appendChild(qrCanvas);

      const urlContainer = el("div", { class: "mb-6" });
      const urlInput = el("input", {
        type: "text",
        readOnly: true,
        value: url,
        class: "w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-400 text-center font-mono focus:outline-none cursor-pointer hover:bg-neutral-700 transition-colors",
        title: "Klicken zum Kopieren"
      });
      urlInput.addEventListener("click", () => {
        navigator.clipboard.writeText(url);
        const originalVal = urlInput.value;
        urlInput.value = "Kopiert!";
        setTimeout(() => (urlInput.value = originalVal), 2000);
      });
      urlContainer.appendChild(urlInput);
      
      const closeBtn = el("button", { 
        class: "w-full py-2 text-sm text-neutral-400 hover:text-white transition-colors cursor-pointer font-medium" 
      }, "Schließen");
      
      closeBtn.addEventListener("click", () => {
        document.body.removeChild(popup);
      });

      card.appendChild(title);
      card.appendChild(qrContainer);
      card.appendChild(urlContainer);
      card.appendChild(closeBtn);
      popup.appendChild(card);
      document.body.appendChild(popup);

      import("qrcode").then(QRCode => {
        QRCode.toCanvas(qrCanvas, url, { width: 400, margin: 2 }, (err) => {
          if (err) console.error("QR Code generation failed", err);
        });
      }).catch(e => {
        console.error("Failed to load qrcode library", e);
        qrContainer.innerHTML = '<p class="text-black text-xs">QR Code konnte nicht generiert werden</p>';
      });
    });

    headerActions.appendChild(menuBtn);
    headerActions.appendChild(resetBtn);
    headerActions.appendChild(qrBtn);
    headerRow.appendChild(weekLabel);
    headerRow.appendChild(headerActions);
    this.container.appendChild(headerRow);


    if (!restaurant) {
      const msg = el("p", { class: "text-neutral-500 italic" }, "Wähle ein Restaurant oben …");
      this.container.appendChild(msg);
      return this.container;
    }

    if (!sheet) {
      const msg = el("p", { class: "text-neutral-500 italic" }, "Erstelle eine neue Bestellung oben …");
      this.container.appendChild(msg);
      return this.container;
    } 

    const formCard = this.buildForm();
    this.container.appendChild(formCard);

    const sortedOrders = sheet.getSortedOrders(this.sortMode);
    const tableCard = this.buildTable(sortedOrders);
    this.container.appendChild(tableCard);

    const summary = this.buildSummary(sheet);
    this.container.appendChild(summary);

    this.container.appendChild(this.menuPanel.render());

    return this.container;
  }

  private buildForm(): HTMLElement {
    const card = el("div", {
      class:
        "bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 mb-8 shadow-xl shadow-black/30 backdrop-blur-sm animate-in-delay-1",
    });

    const isEditing = this.editingPerson !== null;
    const existingOrder = isEditing
      ? this.orderService.getCurrentSheet()?.getOrder(this.editingPerson!)
      : null;

    const labelRow = el("div", { class: "flex items-center justify-between mb-5" });
    const label = el("p", {
      class: "text-[11px] text-neutral-500 uppercase tracking-[0.2em] font-display",
    }, isEditing ? `Bestellung bearbeiten · ${this.editingPerson}` : "Neue Bestellung");

    if (isEditing) {
      const cancelBtn = el("button", {
        class: "text-xs text-neutral-500 hover:text-white transition-colors cursor-pointer",
      }, "Abbrechen");
      cancelBtn.addEventListener("click", () => {
        this.editingPerson = null;
        this.render();
      });
      labelRow.appendChild(label);
      labelRow.appendChild(cancelBtn);
    } else {
      labelRow.appendChild(label);
    }

    card.appendChild(labelRow);

    const row = el("div", { class: "flex flex-wrap gap-3 items-end" });

    const nameGroup = el("div", { class: "flex-1 min-w-[140px]" });
    const nameLabel = el("label", { class: "block text-[10px] text-neutral-500 uppercase tracking-widest mb-1.5" }, "Name");
    const nameInput = el("input", {
      type: "text",
      placeholder: "Dein Name",
      autocomplete: "off",
      class:
        "w-full px-3 py-2.5 text-sm bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none transition-all",
      id: "order-name",
    });
    if (isEditing) {
      (nameInput as HTMLInputElement).value = this.editingPerson ?? "";
      (nameInput as HTMLInputElement).disabled = true;
      nameInput.setAttribute("class", (nameInput.getAttribute("class") ?? "") + " opacity-60 cursor-not-allowed");
    }
    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);

    const nrGroup = el("div", { class: "w-20" });
    const nrLabel = el("label", { class: "block text-[10px] text-neutral-500 uppercase tracking-widest mb-1.5" }, "Nr.");
    const nrInput = el("input", {
      type: "text",
      inputmode: "numeric",
      placeholder: "•",
      autocomplete: "off",
      class:
        "w-full px-3 py-2.5 text-sm bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none transition-all font-mono text-center",
      id: "order-nr",
    });
    if (existingOrder && existingOrder.menuNumber > 0) {
      (nrInput as HTMLInputElement).value = String(existingOrder.menuNumber);
    }
    nrGroup.appendChild(nrLabel);
    nrGroup.appendChild(nrInput);

    const itemGroup = el("div", { class: "flex-1 min-w-[180px] relative" });
    const itemLabel = el("label", { class: "block text-[10px] text-neutral-500 uppercase tracking-widest mb-1.5" }, "Gericht");
    const itemInput = el("input", {
      type: "text",
      placeholder: "Gerichtname",
      autocomplete: "off",
      class:
        "w-full px-3 py-2.5 text-sm bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none transition-all",
      id: "order-item",
    });
    if (existingOrder) (itemInput as HTMLInputElement).value = existingOrder.itemName;
    const autocompleteList = el("div", { class: "autocomplete-dropdown", id: "order-item-autocomplete" });
    itemGroup.appendChild(itemLabel);
    itemGroup.appendChild(itemInput);
    itemGroup.appendChild(autocompleteList);

    let autocompleteIndex = -1;

    const updateAutocomplete = () => {
      clearChildren(autocompleteList);
      autocompleteIndex = -1;
      const query = (itemInput as HTMLInputElement).value.trim().toLowerCase();
      if (!query) return;
      const restaurant = this.restaurantService.getById(this.restaurantId);
      if (!restaurant) return;
      const matches = [...restaurant.menuItems.values()]
        .filter((item) => item.name.toLowerCase().includes(query))
        .sort((a, b) => a.menuNumber - b.menuNumber)
        .slice(0, 8);
      if (matches.length === 0) return;
      for (const match of matches) {
        const entry = el("div", { class: "autocomplete-item" });
        const nrSpan = el("span", { class: "item-nr" }, String(match.menuNumber));
        const nameSpan = el("span", { class: "item-name" }, match.name);
        const priceSpan = el("span", { class: "item-price" }, formatEuro(match.price));
        entry.appendChild(nrSpan);
        entry.appendChild(nameSpan);
        entry.appendChild(priceSpan);
        entry.addEventListener("mousedown", (e) => {
          e.preventDefault();
          (nrInput as HTMLInputElement).value = String(match.menuNumber);
          (itemInput as HTMLInputElement).value = match.name;
          (priceInput as HTMLInputElement).value = centsToInputValue(match.price);
          clearChildren(autocompleteList);
          autocompleteIndex = -1;
          (paidInput as HTMLInputElement).focus();
        });
        autocompleteList.appendChild(entry);
      }
    };

    itemInput.addEventListener("input", updateAutocomplete);
    itemInput.addEventListener("focus", updateAutocomplete);
    itemInput.addEventListener("blur", () => {
      setTimeout(() => {
        clearChildren(autocompleteList);
        autocompleteIndex = -1;
      }, 150);
    });
    itemInput.addEventListener("keydown", (e) => {
      const items = autocompleteList.querySelectorAll(".autocomplete-item");
      if (items.length === 0) {
        if (e.key === "Enter") {
          (priceInput as HTMLInputElement).focus();
          e.preventDefault();
        }
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        autocompleteIndex = Math.min(autocompleteIndex + 1, items.length - 1);
        items.forEach((el, i) => el.classList.toggle("active", i === autocompleteIndex));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        autocompleteIndex = Math.max(autocompleteIndex - 1, 0);
        items.forEach((el, i) => el.classList.toggle("active", i === autocompleteIndex));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (autocompleteIndex >= 0 && autocompleteIndex < items.length) {
          items[autocompleteIndex].dispatchEvent(new MouseEvent("mousedown"));
        } else {
          (priceInput as HTMLInputElement).focus();
        }
      } else if (e.key === "Escape") {
        clearChildren(autocompleteList);
        autocompleteIndex = -1;
      }
    });

    const priceGroup = el("div", { class: "w-28" });
    const priceLabel = el("label", { class: "block text-[10px] text-neutral-500 uppercase tracking-widest mb-1.5" }, "Preis");
    const priceInput = el("input", {
      type: "text",
      inputmode: "decimal",
      placeholder: "0,00",
      autocomplete: "off",
      class:
        "w-full px-3 py-2.5 text-sm bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none transition-all font-mono",
      id: "order-price",
    });
    if (existingOrder) (priceInput as HTMLInputElement).value = centsToInputValue(existingOrder.price);
    priceGroup.appendChild(priceLabel);
    priceGroup.appendChild(priceInput);

    const paidGroup = el("div", { class: "w-28" });
    const paidLabel = el("label", { class: "block text-[10px] text-neutral-500 uppercase tracking-widest mb-1.5" }, "Gegeben");
    const paidInput = el("input", {
      type: "text",
      inputmode: "decimal",
      placeholder: "0,00",
      autocomplete: "off",
      class:
        "w-full px-3 py-2.5 text-sm bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none transition-all font-mono",
      id: "order-paid",
    });
    if (existingOrder) (paidInput as HTMLInputElement).value = centsToInputValue(existingOrder.paid);
    paidGroup.appendChild(paidLabel);
    paidGroup.appendChild(paidInput);

    const submitBtn = el("button", {
      class:
        "px-6 py-2.5 bg-amber-500 text-neutral-900 text-sm font-bold rounded-lg hover:bg-amber-400 active:scale-95 transition-all cursor-pointer shrink-0 shadow-lg shadow-amber-500/20 font-display tracking-wide",
    }, isEditing ? "Speichern" : "Bestellen");

    submitBtn.addEventListener("click", () => {
      const personName = (nameInput as HTMLInputElement).value.trim();
      const menuNumber = parseInt((nrInput as HTMLInputElement).value, 10);
      const itemName = (itemInput as HTMLInputElement).value.trim();
      const price = euroToCents((priceInput as HTMLInputElement).value);
      const paid = euroToCents((paidInput as HTMLInputElement).value);
      const comment = (commentInput as HTMLInputElement).value.trim();
      if (!personName || !itemName || price <= 0) return;

      const order = new Order(
        personName,
        menuNumber || 0,
        itemName,
        price,
        paid,
        new Date().toISOString(),
        comment,
      );
      this.orderService.addOrder(order);
      this.editingPerson = null;
      this.render();
      if (this.onChange) this.onChange();
    });

    row.appendChild(nameGroup);
    row.appendChild(nrGroup);
    row.appendChild(itemGroup);
    row.appendChild(priceGroup);
    row.appendChild(paidGroup);
    row.appendChild(submitBtn);
    card.appendChild(row);

    const commentRow = el("div", { class: "flex flex-wrap gap-3 items-end mt-3" });
    const commentGroup = el("div", { class: "flex-1" });
    const commentLabel = el("label", { class: "block text-[10px] text-neutral-500 uppercase tracking-widest mb-1.5" }, "Kommentar");
    const commentInput = el("input", {
      type: "text",
      placeholder: "Salamai, mit alles, etc.",
      autocomplete: "off",
      class:
        "w-full px-3 py-2.5 text-sm bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none transition-all",
      id: "order-comment",
    });
    if (existingOrder) (commentInput as HTMLInputElement).value = existingOrder.comment;
    commentGroup.appendChild(commentLabel);
    commentGroup.appendChild(commentInput);
    commentRow.appendChild(commentGroup);
    card.appendChild(commentRow);

    nrInput.addEventListener("input", () => {
      const nr = parseInt((nrInput as HTMLInputElement).value, 10);
      if (!nr) return;
      const item = this.restaurantService.lookupMenuItem(this.restaurantId, nr);
      if (item) {
        (itemInput as HTMLInputElement).value = item.name;
        (priceInput as HTMLInputElement).value = centsToInputValue(item.price);
        clearChildren(autocompleteList);
        autocompleteIndex = -1;
      }
    });

    priceInput.addEventListener("blur", () => {
      const price = euroToCents((priceInput as HTMLInputElement).value);
      if (price > 0) {
        (priceInput as HTMLInputElement).value = centsToInputValue(price);
      }
    });

    paidInput.addEventListener("blur", () => {
      const paid = euroToCents((paidInput as HTMLInputElement).value);
      if (paid > 0) {
        (paidInput as HTMLInputElement).value = centsToInputValue(paid);
      }
    });

    const form = card;
    nrInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        (itemInput as HTMLInputElement).focus();
        e.preventDefault();
      }
    });

    itemInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        (priceInput as HTMLInputElement).focus();
        e.preventDefault();
      }
    });

    priceInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        (paidInput as HTMLInputElement).focus();
        e.preventDefault();
      }
    });

    paidInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        (commentInput as HTMLInputElement).focus();
        e.preventDefault();
      }
    });

    commentInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        (submitBtn as HTMLButtonElement).click();
        e.preventDefault();
      }
    });

    return form;
  }

  private buildTable(orders: Order[]): HTMLElement {
    const card = el("div", {
      class:
        "bg-neutral-900/80 border border-neutral-800 rounded-2xl overflow-hidden mb-6 shadow-xl shadow-black/30 backdrop-blur-sm animate-in-delay-2",
    });

    if (orders.length === 0) {
      const empty = el("div", { class: "p-10 text-center" });
      const emptyText = el("p", { class: "text-neutral-600 text-sm" }, "Noch keine Bestellungen …");
      const emptySub = el("p", { class: "text-neutral-700 text-xs mt-1" }, "Trag dich oben ein!");
      empty.appendChild(emptyText);
      empty.appendChild(emptySub);
      card.appendChild(empty);
      return card;
    }

    const headerBar = el("div", {
      class: "flex items-center gap-3 px-6 py-3 bg-neutral-800/60 border-b border-neutral-800/80 text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-display",
    });

    const sortNrBtn = el("button", {
      class: `w-9 shrink-0 text-left cursor-pointer transition-colors ${this.sortMode === "number" ? "text-amber-400" : "text-neutral-500 hover:text-amber-400"}`,
      title: "Nach Nummer sortieren",
    }, this.sortMode === "number" ? "Nr. ▾" : "Nr.");
    sortNrBtn.addEventListener("click", () => {
      this.sortMode = this.sortMode === "number" ? "default" : "number";
      this.render();
    });

    const sortNameBtn = el("span", { class: "w-28 shrink-0" }, "Name");

    const hItem = el("span", { class: "flex-1 min-w-0" }, "Gericht");
    const hComment = el("span", { class: "w-36 shrink-0" }, "Kommentar");
    const hPrice = el("span", { class: "w-24 text-right" }, "Preis");
    const hPaid = el("span", { class: "w-24 text-right" }, "Gegeben");
    const hTip = el("span", { class: "w-20 text-right" }, "Trinkgeld");
    const hActions = el("span", { class: "w-10 shrink-0" });
    headerBar.appendChild(sortNrBtn);
    headerBar.appendChild(sortNameBtn);
    headerBar.appendChild(hItem);
    headerBar.appendChild(hComment);
    headerBar.appendChild(hPrice);
    headerBar.appendChild(hPaid);
    headerBar.appendChild(hTip);
    headerBar.appendChild(hActions);

    const table = el("div", { class: "divide-y divide-neutral-800/50" });

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const row = el("div", {
        class: "flex items-center gap-3 px-6 py-4 hover:bg-neutral-800/40 transition-colors group",
        style: `animation: fade-in-up 0.3s ease-out ${0.05 * i}s both;`,
      });

      const nrBadge = order.menuNumber > 0
        ? el("span", {
            class: "w-9 h-9 rounded-lg bg-neutral-800 text-amber-400 text-xs font-mono font-bold flex items-center justify-center shrink-0 border border-neutral-700/50",
          }, String(order.menuNumber))
        : el("span", { class: "w-9 h-9 rounded-lg bg-neutral-800 text-neutral-600 text-xs flex items-center justify-center shrink-0 border border-neutral-700/50" }, "—");

      const nameCol = el("span", { class: "w-28 text-sm text-white font-medium truncate shrink-0" }, order.personName);
      const itemCol = el("span", { class: "flex-1 min-w-0 text-sm text-neutral-300 truncate" }, order.itemName);
      const commentCol = el("span", {
        class: `w-36 shrink-0 text-sm truncate ${order.comment ? "text-neutral-400" : "text-neutral-700"}`,
        title: order.comment || "",
      }, order.comment || "—");
      const priceCol = el("span", { class: "w-24 text-sm text-neutral-400 font-mono tabular-nums text-right" }, formatEuro(order.price));
      const paidCol = el("span", {
        class: `w-24 text-sm font-mono tabular-nums text-right font-medium ${order.paid >= order.price ? "text-emerald-400" : "text-red-400"}`,
      }, formatEuro(order.paid));

      const tipVal = order.paid - order.price;
      const tipCol = el("span", {
        class: `w-20 text-sm font-mono tabular-nums text-right ${tipVal > 0 ? "text-emerald-400/60" : tipVal < 0 ? "text-red-400/60" : "text-neutral-600"}`,
      }, tipVal !== 0 ? (tipVal > 0 ? "+" : "") + formatEuro(tipVal) : "—");

      const actions = el("div", { class: "flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 w-10" });
      const editBtn = el("button", {
        class: "text-neutral-500 hover:text-amber-400 transition-colors text-xs cursor-pointer p-1.5 rounded hover:bg-neutral-800",
        title: "Bearbeiten",
      }, "✎");
      editBtn.addEventListener("click", () => {
        this.editingPerson = order.personName;
        this.render();
        const nrEl = document.getElementById("order-nr") as HTMLInputElement;
        if (nrEl) nrEl.focus();
      });

      const delBtn = el("button", {
        class: "text-neutral-500 hover:text-red-400 transition-colors text-xs cursor-pointer p-1.5 rounded hover:bg-neutral-800",
        title: "Entfernen",
      }, "✕");
      delBtn.addEventListener("click", () => {
        this.orderService.removeOrder(order.personName);
        this.render();
        if (this.onChange) this.onChange();
      });

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      row.appendChild(nrBadge);
      row.appendChild(nameCol);
      row.appendChild(itemCol);
      row.appendChild(commentCol);
      row.appendChild(priceCol);
      row.appendChild(paidCol);
      row.appendChild(tipCol);
      row.appendChild(actions);
      table.appendChild(row);
    }

    card.appendChild(headerBar);
    card.appendChild(table);
    return card;
  }

  private buildSummary(sheet: { orderCount: number; total: number; totalPaid: number; totalTip: number }): HTMLElement {
    const bar = el("div", {
      class:
        "bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 flex items-center justify-around gap-6 flex-wrap backdrop-blur-sm animate-in-delay-2",
    });

    const countItem = this.summaryItem(String(sheet.orderCount), "Bestellungen", "text-white");
    const totalItem = this.summaryItem(formatEuro(sheet.total), "Gesamt", "text-amber-400");
    const paidItem = this.summaryItem(formatEuro(sheet.totalPaid), "Bezahlt", sheet.totalPaid >= sheet.total ? "text-emerald-400" : "text-red-400");
    const tipItem = this.summaryItem(
      (sheet.totalTip > 0 ? "+" : "") + formatEuro(sheet.totalTip),
      "Trinkgeld",
      sheet.totalTip > 0 ? "text-emerald-400" : sheet.totalTip < 0 ? "text-red-400" : "text-neutral-500",
    );

    const divider = el("div", { class: "w-px h-10 bg-neutral-800 shrink-0 hidden sm:block" });

    bar.appendChild(countItem);
    bar.appendChild(divider.cloneNode(true) as HTMLElement);
    bar.appendChild(totalItem);
    bar.appendChild(divider.cloneNode(true) as HTMLElement);
    bar.appendChild(paidItem);
    bar.appendChild(divider.cloneNode(true) as HTMLElement);
    bar.appendChild(tipItem);
    return bar;
  }

  private summaryItem(value: string, label: string, valueClass: string): HTMLElement {
    const item = el("div", { class: "text-center" });
    const val = el("p", { class: `text-xl font-bold font-mono tabular-nums ${valueClass}` }, value);
    const lbl = el("p", { class: "text-[10px] uppercase tracking-[0.18em] text-neutral-500 mt-1 font-display" }, label);
    item.appendChild(val);
    item.appendChild(lbl);
    return item;
  }

  renderTable(): void {
    const sheet = this.orderService.getCurrentSheet();
    if (!sheet) return;
    const sortedOrders = sheet.getSortedOrders(this.sortMode);
    const existingTable = this.container.querySelector(":scope > div:nth-child(3)");
    if (existingTable) {
      const newTable = this.buildTable(sortedOrders);
      existingTable.replaceWith(newTable);
    }
    const existingSummary = this.container.querySelector(":scope > div:nth-child(4)");
    if (existingSummary) {
      const newSummary = this.buildSummary(sheet);
      existingSummary.replaceWith(newSummary);
    }
  }
}