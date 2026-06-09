import "./style.css";
import { StorageService } from "./services/StorageService";
import { RestaurantService } from "./services/RestaurantService";
import { OrderService } from "./services/OrderService";
import { App } from "./ui/App";

const storage = new StorageService();
const restaurantService = new RestaurantService(storage);
const orderService = new OrderService(storage, restaurantService);

const app = new App(restaurantService, orderService);
const root = document.getElementById("app");
if (root) {
  root.appendChild(app.render());
}