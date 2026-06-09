import { Restaurant } from "../models/Restaurant";
import { MenuItem } from "../models/MenuItem";
import { StorageService } from "./StorageService";

export class RestaurantService {
  private restaurants: Map<string, Restaurant> = new Map();

  constructor(private storage: StorageService) {
    this.load();
  }

  private load(): void {
    const list = this.storage.loadRestaurants();
    this.restaurants.clear();
    for (const r of list) {
      this.restaurants.set(r.id, r);
    }
  }

  private persist(): void {
    this.storage.saveRestaurants([...this.restaurants.values()]);
  }

  getAll(): Restaurant[] {
    return [...this.restaurants.values()].sort((a, b) => a.name.localeCompare(b.name, "de"));
  }

  getById(id: string): Restaurant | undefined {
    return this.restaurants.get(id);
  }

  create(name: string): Restaurant {
    const id = name
      .toLowerCase()
      .replace(/[^a-z0-9äöüß]+/g, "-")
      .replace(/(^-|-$)/g, "")
      + "-" + Date.now().toString(36);
    const restaurant = new Restaurant(id, name);
    this.restaurants.set(id, restaurant);
    this.persist();
    return restaurant;
  }

  update(id: string, name: string): Restaurant | undefined {
    const r = this.restaurants.get(id);
    if (!r) return undefined;
    r.name = name;
    this.persist();
    return r;
  }

  delete(id: string): boolean {
    const deleted = this.restaurants.delete(id);
    if (deleted) this.persist();
    return deleted;
  }

  addMenuItem(restaurantId: string, menuNumber: number, name: string, price: number): MenuItem | null {
    const r = this.restaurants.get(restaurantId);
    if (!r) return null;
    r.addOrUpdateItem(menuNumber, name, price);
    this.persist();
    return r.getItem(menuNumber) ?? null;
  }

  removeMenuItem(restaurantId: string, menuNumber: number): boolean {
    const r = this.restaurants.get(restaurantId);
    if (!r) return false;
    const removed = r.removeItem(menuNumber);
    if (removed) this.persist();
    return removed;
  }

  lookupMenuItem(restaurantId: string, menuNumber: number): MenuItem | undefined {
    return this.restaurants.get(restaurantId)?.getItem(menuNumber);
  }
}