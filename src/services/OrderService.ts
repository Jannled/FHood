import { Order } from "../models/Order";
import { OrderSheet } from "../models/OrderSheet";
import { StorageService } from "./StorageService";
import { RestaurantService } from "./RestaurantService";

export function getCurrentWeekKey(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneDay = 86400000;
  const dayOfYear = Math.floor(diff / oneDay);
  const week = Math.ceil((dayOfYear + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function formatWeekKey(key: string): string {
  const match = key.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return key;
  const year = match[1];
  const week = parseInt(match[2], 10);
  const jan4 = new Date(Number(year), 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.`;
  return `${fmt(monday)} – ${fmt(friday)}${friday.getFullYear()}`;
}

export function getWeekStartDate(key: string): Date | null {
  const match = key.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
  return monday;
}

export class OrderService {
  private sheets: Map<string, OrderSheet> = new Map();

  constructor(
    private storage: StorageService,
    private restaurantService: RestaurantService,
  ) {
    this.load();
  }

  private load(): void {
    this.sheets = this.storage.loadOrderSheets();
  }

  private persist(): void {
    this.storage.saveOrderSheets(this.sheets);
  }

  private sheetKey(restaurantId: string): string {
    return `${restaurantId}:${getCurrentWeekKey()}`;
  }

  getCurrentSheet(restaurantId: string): OrderSheet {
    const key = this.sheetKey(restaurantId);
    const existing = this.sheets.get(key);
    if (existing) return existing;
    const sheet = new OrderSheet(getCurrentWeekKey(), restaurantId);
    this.sheets.set(key, sheet);
    return sheet;
  }

  addOrder(restaurantId: string, order: Order): void {
    const sheet = this.getCurrentSheet(restaurantId);
    sheet.upsertOrder(order);
    const existing = this.restaurantService.lookupMenuItem(restaurantId, order.menuNumber);
    if (!existing || existing.name !== order.itemName || existing.price !== order.price) {
      this.restaurantService.addMenuItem(restaurantId, order.menuNumber, order.itemName, order.price);
    }
    this.persist();
  }

  removeOrder(restaurantId: string, personName: string): void {
    const key = this.sheetKey(restaurantId);
    const sheet = this.sheets.get(key);
    if (!sheet) return;
    sheet.removeOrder(personName);
    this.persist();
  }

  resetCurrentWeek(restaurantId: string): void {
    const key = this.sheetKey(restaurantId);
    const sheet = new OrderSheet(getCurrentWeekKey(), restaurantId);
    this.sheets.set(key, sheet);
    this.persist();
  }

  deleteAllOrdersForRestaurant(restaurantId: string): void {
    for (const [key] of this.sheets) {
      if (key.startsWith(`${restaurantId}:`)) {
        this.sheets.delete(key);
      }
    }
    this.persist();
  }
}