import { Restaurant } from "../models/Restaurant";
import { OrderSheet } from "../models/OrderSheet";

const MENU_KEY = "fhood_menu";
const ORDERS_KEY = "fhood_orders";

function parseOrNull(raw: string | null): unknown | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export class StorageService {
  loadRestaurants(): Restaurant[] {
    const raw = parseOrNull(localStorage.getItem(MENU_KEY));
    if (!raw || !Array.isArray(raw)) return [];
    return raw.map((r: unknown) => Restaurant.fromJSON(r));
  }

  saveRestaurants(restaurants: Restaurant[]): void {
    localStorage.setItem(MENU_KEY, JSON.stringify(restaurants.map((r) => r.toJSON())));
  }

  loadOrderSheets(): Map<string, OrderSheet> {
    const raw = parseOrNull(localStorage.getItem(ORDERS_KEY));
    if (!raw || !Array.isArray(raw)) return new Map();
    const map = new Map<string, OrderSheet>();
    for (const s of raw as unknown[]) {
      const sheet = OrderSheet.fromJSON(s);
      const key = `${sheet.restaurantId}:${sheet.weekKey}`;
      map.set(key, sheet);
    }
    return map;
  }

  saveOrderSheets(sheets: Map<string, OrderSheet>): void {
    localStorage.setItem(ORDERS_KEY, JSON.stringify([...sheets.values()].map((s) => s.toJSON())));
  }
}