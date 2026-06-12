import { Order } from "./Order";

export type SortMode = "default" | "number";

export class OrderSheet {
  public orders: Map<string, Order>;
  public id: string;

  constructor(
    public date: Date,
    public restaurantId: string,
    orders?: Map<string, Order>,
    id?: string
  ) {
    this.id = id ?? crypto.randomUUID();
    this.orders = orders ?? new Map();
  }

  static fromJSON(data: unknown): OrderSheet {
    if (!data || typeof data !== "object") throw new Error("Invalid OrderSheet data");
    const d = data as Record<string, unknown>;
    const orders = new Map<string, Order>();
    const rawOrders = d.orders;
    if (rawOrders && typeof rawOrders === "object") {
      const entries = Array.isArray(rawOrders)
        ? rawOrders
        : Object.entries(rawOrders as Record<string, unknown>);
      for (const entry of entries) {
        if (Array.isArray(entry)) {
          const [key, val] = entry as [unknown, unknown];
          const order = Order.fromJSON(val);
          orders.set(String(key), order);
        } else {
          const order = Order.fromJSON(entry);
          orders.set(order.personName, order);
        }
      }
    }
    return new OrderSheet(new Date(String(d.date ?? "")), String(d.restaurantId ?? ""), orders, String(d.id));
  }

  toJSON(): object {
    const orders: Record<string, unknown> = {};
    for (const [name, order] of this.orders) {
      orders[name] = order.toJSON();
    }
    return { id: this.id, date: this.date.toISOString(), restaurantId: this.restaurantId, orders };
  }

  upsertOrder(order: Order): void {
    this.orders.set(order.personName, order);
  }

  removeOrder(personName: string): boolean {
    return this.orders.delete(personName);
  }

  getOrder(personName: string): Order | undefined {
    return this.orders.get(personName);
  }

  get total(): number {
    let sum = 0;
    for (const order of this.orders.values()) sum += order.price;
    return sum;
  }

  get totalPaid(): number {
    let sum = 0;
    for (const order of this.orders.values()) sum += order.paid;
    return sum;
  }

  get totalTip(): number {
    return this.totalPaid - this.total;
  }

  get orderCount(): number {
    return this.orders.size;
  }

  getSortedOrders(sortMode: SortMode): Order[] {
    if (sortMode === "number") {
      return [...this.orders.values()].sort((a, b) => {
        if (a.menuNumber === 0 && b.menuNumber === 0) return 0;
        if (a.menuNumber === 0) return 1;
        if (b.menuNumber === 0) return -1;
        return a.menuNumber - b.menuNumber;
      });
    }
    return [...this.orders.values()];
  }
}