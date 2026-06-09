export class MenuItem {
  constructor(
    public menuNumber: number,
    public name: string,
    public price: number,
  ) {}

  static fromJSON(data: unknown): MenuItem {
    if (!data || typeof data !== "object") throw new Error("Invalid MenuItem data");
    const d = data as Record<string, unknown>;
    return new MenuItem(
      Number(d.menuNumber) || 0,
      String(d.name ?? ""),
      Number(d.price) || 0,
    );
  }

  toJSON(): object {
    return { menuNumber: this.menuNumber, name: this.name, price: this.price };
  }
}