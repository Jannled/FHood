import { MenuItem } from "./MenuItem";

export class Restaurant {
  public menuItems: Map<number, MenuItem>;

  constructor(
    public id: string,
    public name: string,
    menuItems?: Map<number, MenuItem>,
  ) {
    this.menuItems = menuItems ?? new Map();
  }

  static fromJSON(data: unknown): Restaurant {
    if (!data || typeof data !== "object") throw new Error("Invalid Restaurant data");
    const d = data as Record<string, unknown>;
    const items = new Map<number, MenuItem>();
    const rawItems = d.menuItems;
    if (rawItems && typeof rawItems === "object") {
      const entries = Array.isArray(rawItems)
        ? rawItems
        : Object.entries(rawItems as Record<string, unknown>);
      for (const entry of entries) {
        if (Array.isArray(entry)) {
          const [, val] = entry as [unknown, unknown];
          const item = MenuItem.fromJSON(val);
          items.set(item.menuNumber, item);
        } else {
          const item = MenuItem.fromJSON(entry);
          items.set(item.menuNumber, item);
        }
      }
    }
    return new Restaurant(String(d.id ?? ""), String(d.name ?? ""), items);
  }

  toJSON(): object {
    const items: Record<string, unknown> = {};
    for (const [num, item] of this.menuItems) {
      items[String(num)] = item.toJSON();
    }
    return { id: this.id, name: this.name, menuItems: items };
  }

  addOrUpdateItem(menuNumber: number, name: string, variant: string, price: number): void {
    let item = this.menuItems.get(menuNumber);
    if (!item) {
      const variants = new Map<string, number>();
      item = new MenuItem(menuNumber, name, variants);
      this.menuItems.set(menuNumber, item);
    }
    item.name = name;
    item.variants.set(variant, price);
  }

  getItem(menuNumber: number): MenuItem | undefined {
    return this.menuItems.get(menuNumber);
  }

  removeItem(menuNumber: number): boolean {
    return this.menuItems.delete(menuNumber);
  }
}