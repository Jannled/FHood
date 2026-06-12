import "./style.css";
import { StorageService } from "./services/StorageService";
import { RestaurantService } from "./services/RestaurantService";
import { OrderService } from "./services/OrderService";
import { App } from "./ui/App";
import { Restaurant } from "./models/Restaurant";
import { OrderSheet } from "./models/OrderSheet";

const storage = new StorageService();
const restaurantService = new RestaurantService(storage);
const orderService = new OrderService(storage, restaurantService);

function handleImport() {
  const params = new URLSearchParams(window.location.search);
  const importData = params.get("import");
  if (!importData) return;

  try {
    const data = JSON.parse(decodeURIComponent(importData));
    if (data.restaurant) {
      restaurantService.import(Restaurant.fromJSON(data.restaurant));
    }
    if (data.order) {
      orderService.import(OrderSheet.fromJSON(data.order));
    }
    
    params.delete("import");
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState({}, document.title, newUrl);
  } catch (e) {
    console.error("Failed to import data", e);
  }
}


handleImport();

const app = new App(restaurantService, orderService);
const root = document.getElementById("app");
if (root) {
  root.appendChild(app.render());
}