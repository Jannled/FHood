import { RestaurantService } from "../services/RestaurantService";
import { OrderService } from "../services/OrderService";
import { OrderView } from "./OrderView";
import { el, clearChildren } from "./utils";

export class App {
  private container: HTMLElement;
  private orderView: OrderView;
  private currentRestaurantId: string | null = null;

  constructor(
    private restaurantService: RestaurantService,
    private orderService: OrderService,
  ) {
    this.container = el("div", { class: "min-h-screen" });
    this.orderView = new OrderView(restaurantService, orderService, "");

    const restaurants = restaurantService.getAll();
    if (restaurants.length > 0) {
      this.currentRestaurantId = restaurants[0].id;
      this.orderView.setRestaurant(this.currentRestaurantId);
    }
  }

  render(): HTMLElement {
    clearChildren(this.container);

    const header = this.buildHeader();
    this.container.appendChild(header);

    if (!this.currentRestaurantId) {
      const welcome = this.buildWelcome();
      this.container.appendChild(welcome);
    } else {
      const main = this.orderView.render();
      this.container.appendChild(main);
    }

    return this.container;
  }

  private buildHeader(): HTMLElement {
    const header = el("header", {
      class: "border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-lg sticky top-0 z-40",
    });

    const inner = el("div", { class: "max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4" });

    const logo = el("div", { class: "flex items-baseline gap-3" });
    const brand = el("h1", {
      class: "text-2xl font-extrabold text-amber-400 tracking-tight font-display",
    }, "FHood");
    const tagline = el("span", {
      class: "text-[10px] uppercase tracking-[0.3em] text-neutral-600 hidden sm:inline font-display",
    }, "Fachkasten Kostplaner");
    logo.appendChild(brand);
    logo.appendChild(tagline);

    const nav = el("div", { class: "flex items-center gap-3" });

    const selectWrap = el("div", { class: "relative" });
    const select = el("select", {
      class:
        "appearance-none bg-neutral-800/80 border border-neutral-700 text-white text-sm rounded-lg px-4 py-2 pr-9 focus:border-amber-500 focus:outline-none transition-all cursor-pointer backdrop-blur-sm",
      id: "restaurant-select",
    });

    const restaurants = this.restaurantService.getAll();
    for (const r of restaurants) {
      const opt = el("option", { value: r.id }, r.name);
      if (r.id === this.currentRestaurantId) opt.setAttribute("selected", "");
      select.appendChild(opt);
    }

    if (restaurants.length === 0) {
      const placeholder = el("option", { value: "", disabled: "disabled", selected: "selected" }, "Restaurant wählen …");
      select.appendChild(placeholder);
    }

    select.addEventListener("change", () => {
      const val = (select as HTMLSelectElement).value;
      this.currentRestaurantId = val || null;
      this.orderView.setRestaurant(val);
      this.render();
    });

    const chevron = el("div", {
      class: "absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none",
      style: "width:12px;height:12px",
    });

    const chevronSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    chevronSvg.setAttribute("viewBox", "0 0 12 12");
    chevronSvg.setAttribute("fill", "none");
    chevronSvg.setAttribute("stroke", "currentColor");
    chevronSvg.setAttribute("stroke-width", "1.5");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M3 4.5L6 7.5L9 4.5");
    chevronSvg.appendChild(path);
    chevron.appendChild(chevronSvg);

    selectWrap.appendChild(select);
    selectWrap.appendChild(chevron);

    const addBtn = el("button", {
      class:
        "text-sm text-neutral-400 hover:text-amber-400 transition-all cursor-pointer border border-neutral-700 px-3.5 py-2 rounded-lg hover:border-amber-400/30 font-display font-medium tracking-wide",
      title: "Neues Restaurant anlegen",
    }, "+ Restaurant");
    addBtn.addEventListener("click", () => this.showAddRestaurantDialog());

    nav.appendChild(selectWrap);
    nav.appendChild(addBtn);

    if (this.currentRestaurantId) {
      const manageBtn = el("button", {
        class:
          "text-neutral-500 hover:text-white transition-colors cursor-pointer p-2 rounded-lg hover:bg-neutral-800",
        title: "Restaurant verwalten/löschen",
      });
      const gearSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      gearSvg.setAttribute("viewBox", "0 0 20 20");
      gearSvg.setAttribute("fill", "currentColor");
      gearSvg.setAttribute("width", "16");
      gearSvg.setAttribute("height", "16");
      const gearPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      gearPath.setAttribute("fill-rule", "evenodd");
      gearPath.setAttribute("clip-rule", "evenodd");
      gearPath.setAttribute("d", "M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 00.98.804l.28.773a6.98 6.98 0 011.457.842l.817-.181a1 1 0 011.133.5l1.18 2.043a1 1 0 01-.197 1.216l-.572.572a7.042 7.042 0 010 1.684l.572.572a1 1 0 01.197 1.216l-1.18 2.043a1 1 0 01-1.133.5l-.817-.181a6.98 6.98 0 01-1.457.842l-.28.773a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.28-.773a6.98 6.98 0 01-1.457-.842l-.817.181a1 1 0 01-1.133-.5L3.973 10.56a1 1 0 01.197-1.216l.572-.572a7.042 7.042 0 010-1.684l-.572-.572a1 1 0 01-.197-1.216l1.18-2.043a1 1 0 011.133-.5l.817.181a6.98 6.98 0 011.457-.842l.28-.773zM10 13a3 3 0 100-6 3 3 0 000 6z");
      gearSvg.appendChild(gearPath);
      manageBtn.appendChild(gearSvg);
      manageBtn.addEventListener("click", () => this.showManageDialog());
      nav.appendChild(manageBtn);
    }

    inner.appendChild(logo);
    inner.appendChild(nav);
    header.appendChild(inner);
    return header;
  }

  private buildWelcome(): HTMLElement {
    const wrap = el("div", { class: "flex items-center justify-center min-h-[70vh]" });
    const card = el("div", { class: "text-center max-w-md animate-in" });

    const brandLarge = el("h1", { class: "text-7xl font-extrabold text-amber-400 mb-2 font-display tracking-tighter" }, "FHood");
    const subtitle = el("p", { class: "text-[11px] uppercase tracking-[0.4em] text-neutral-500 mb-10 font-display" }, "Fachkasten Kostplaner");
    const desc = el("p", { class: "text-sm text-neutral-500 mb-10 leading-relaxed" }, "Der Kostplaner für eure Mittagsbestellung an der Fachhochschule. Leg ein Restaurant an und bestell los.");
    const cta = el("button", {
      class:
        "px-8 py-3.5 bg-amber-500 text-neutral-900 font-bold rounded-xl hover:bg-amber-400 active:scale-[0.98] transition-all cursor-pointer shadow-xl shadow-amber-500/20 font-display tracking-wide text-base",
    }, "Restaurant anlegen");
    cta.addEventListener("click", () => this.showAddRestaurantDialog());

    card.appendChild(brandLarge);
    card.appendChild(subtitle);
    card.appendChild(desc);
    card.appendChild(cta);
    wrap.appendChild(card);
    return wrap;
  }

  private showAddRestaurantDialog(): void {
    const name = prompt("Name des Restaurants:");
    if (!name || !name.trim()) return;
    const restaurant = this.restaurantService.create(name.trim());
    this.currentRestaurantId = restaurant.id;
    this.orderView.setRestaurant(restaurant.id);
    this.render();
  }

  private showManageDialog(): void {
    if (!this.currentRestaurantId) return;
    const restaurant = this.restaurantService.getById(this.currentRestaurantId);
    if (!restaurant) return;

    const action = prompt(
      `Restaurant: ${restaurant.name}\n\nNeuen Namen eingeben = Umbenennen\n"x" eingeben = Löschen\nAbbrechen = Nichts tun`,
    );

    if (action === null) return;

    if (action.trim().toLowerCase() === "x") {
      if (confirm(`"${restaurant.name}" wirklich löschen? Alle Speisekartendaten gehen verloren.`)) {
        this.restaurantService.delete(this.currentRestaurantId);
        this.orderService.deleteAllOrdersForRestaurant(this.currentRestaurantId);
        const remaining = this.restaurantService.getAll();
        this.currentRestaurantId = remaining.length > 0 ? remaining[0].id : null;
        if (this.currentRestaurantId) {
          this.orderView.setRestaurant(this.currentRestaurantId);
        }
        this.render();
      }
    } else if (action.trim()) {
      this.restaurantService.update(this.currentRestaurantId, action.trim());
      this.render();
    }
  }
}