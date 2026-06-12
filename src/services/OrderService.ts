import { Order } from "../models/Order";
import { OrderSheet } from "../models/OrderSheet";
import { StorageService } from "./StorageService";
import { RestaurantService } from "./RestaurantService";

export function formatOrderSheetDate(date?: Date | null): string {
  if (!date) return "";
  const fmt = (d: Date) =>
    `${String(d.getHours())}:${String(d.getMinutes()).padStart(2, "0")} ${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  return fmt(date);
}

export class OrderService {
  private sheets: Map<string, OrderSheet> = new Map();
  private current_sheet_id: string | null = null;

  constructor(
    private storage: StorageService,
    private restaurantService: RestaurantService,
  ) {
    this.load();
  }

  private load(): void {
    this.sheets = this.storage.loadOrderSheets();
    this.current_sheet_id = this.storage.loadCurrentOrderId();
  }

  private persist(): void {
    this.storage.saveOrderSheets(this.sheets);
    this.storage.saveCurrentOrderId(this.current_sheet_id);
  }

  addOrder(order: Order): void {
    const sheet = this.sheets.get(this.current_sheet_id ?? "");
    if (!sheet) return;
    sheet.upsertOrder(order);
    const existing = this.restaurantService.lookupMenuItem(sheet.restaurantId, order.menuNumber);
    if (!existing || existing.name !== order.itemName || existing.price !== order.price) {
      this.restaurantService.addMenuItem(sheet.restaurantId, order.menuNumber, order.itemName, order.price);
    }
    this.persist();
  }

  removeOrder(personName: string): void {
    const sheet = this.sheets.get(this.current_sheet_id ?? "");
    if (!sheet) return;
    sheet.removeOrder(personName);
    this.persist();
  }

  createNewOrderSheet(restaurantId: string): void {
    const sheet = new OrderSheet(new Date(), restaurantId);
    this.sheets.set(sheet.id, sheet);
    this.current_sheet_id = sheet.id;
    this.persist();
  }

  deleteAllOrdersForRestaurant(restaurantId: string): void {
    for (const [key] of this.sheets) {
      if (this.sheets.get(key)?.restaurantId === restaurantId) {
        this.sheets.delete(key);
      }
    }
    this.persist();
  }

  getSheets(): { restaurantId: string; date: Date }[] {
    return [...this.sheets.values()].map((sheet) => ({
      restaurantId: sheet.restaurantId,
      date: sheet.date,
    }));
  }

  getCurrentSheet(): OrderSheet | null {
    return this.sheets.get(this.current_sheet_id ?? "") ?? null;
  }

  nextOrder(): void {
    const sheetsList = [...this.sheets]
      .map((x) => x[1])
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const currentIndex = sheetsList.findIndex((s) => s.date === this.sheets.get(this.current_sheet_id ?? "")?.date);
    if (currentIndex === -1 || currentIndex === sheetsList.length - 1) return;

    this.current_sheet_id = sheetsList[currentIndex + 1].id;
    this.persist();
  }

  previousOrder(): void {
    const sheetsList = [...this.sheets]
      .map((x) => x[1])
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const currentIndex = sheetsList.findIndex((s) => s.date === this.sheets.get(this.current_sheet_id ?? "")?.date);
    if (currentIndex === -1 || currentIndex === 0) return;

    this.current_sheet_id = sheetsList[currentIndex - 1].id;
    this.persist();
  }

  import(sheet: OrderSheet): void {
    this.sheets.set(sheet.id, sheet);
    this.current_sheet_id = sheet.id;
    this.persist();
  }
}