export class MenuItem {
  constructor(
    public menuNumber: number,
    public name: string,
    public variants: Map<string, number>,
  ) {}

  static fromJSON(data: unknown): MenuItem {
    if (!data || typeof data !== "object") throw new Error("Invalid MenuItem data");
    const d = data as Record<string, unknown>;
    
    const variants = new Map<string, number>();
    const rawVariants = d.variants;
    if (rawVariants && typeof rawVariants === "object") {
      for (const [key, value] of Object.entries(rawVariants).sort((a, b) => a[1] - b[1])) {
        variants.set(key, Number(value) || 0);
      }
    }

    return new MenuItem(
      Number(d.menuNumber) || 0,
      String(d.name ?? ""),
      variants,
    );
  }

  toJSON(): object {
    return { 
      menuNumber: this.menuNumber, 
      name: this.name, 
      variants: Object.fromEntries(this.variants) 
    };
  }
}