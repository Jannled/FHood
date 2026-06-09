export class Order {
  constructor(
    public personName: string,
    public menuNumber: number,
    public itemName: string,
    public price: number,
    public paid: number,
    public date: string,
    public comment: string = "",
  ) {}

  static fromJSON(data: unknown): Order {
    if (!data || typeof data !== "object") throw new Error("Invalid Order data");
    const d = data as Record<string, unknown>;
    return new Order(
      String(d.personName ?? ""),
      Number(d.menuNumber) || 0,
      String(d.itemName ?? ""),
      Number(d.price) || 0,
      Number(d.paid) || 0,
      String(d.date ?? ""),
      String(d.comment ?? ""),
    );
  }

  toJSON(): object {
    return {
      personName: this.personName,
      menuNumber: this.menuNumber,
      itemName: this.itemName,
      price: this.price,
      paid: this.paid,
      date: this.date,
      comment: this.comment,
    };
  }

  get tip(): number {
    return this.paid - this.price;
  }
}