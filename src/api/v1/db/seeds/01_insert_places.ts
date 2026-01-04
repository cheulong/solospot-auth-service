// seeds/01_insert_places.ts
import { db } from "../index";
import { placeTable } from "../schema/auth.schema";

const restaurants = [
  { name: "The Golden Spoon" },
  { name: "Blue Harbor Bistro" },
  { name: "Crimson Plate" },
  { name: "Olive & Thyme" },
  { name: "Silver Fork Kitchen" },
  { name: "Urban Flame Grill" },
  { name: "Maple Street Eatery" },
  { name: "Saffron Garden" },
  { name: "Iron Skillet House" },
  { name: "Luna’s Table" },
  { name: "Harvest Moon Café" },
  { name: "Copper Pot Tavern" },
  { name: "Basil & Stone" },
  { name: "Sunset Terrace" },
  { name: "Midnight Noodle Bar" },
  { name: "The Rustic Ladle" },
  { name: "Amber Hearth" },
  { name: "Pearl River Kitchen" },
  { name: "Cedar & Smoke" },
  { name: "Velvet Fork" },
  { name: "Golden Wok" },
  { name: "Seaside Catch" },
  { name: "Firefly Diner" },
  { name: "Stone Oven Pizzeria" },
  { name: "Spice Route" },
  { name: "Green Leaf Café" },
  { name: "Red Lantern Kitchen" },
  { name: "Driftwood Grill" },
  { name: "Royal Curry House" },
  { name: "Morning Bloom Brunch" }
]

export default async function seed() {
  // Remove any existing data
  await db.delete(placeTable);
  
  // Insert all rows in one call
  await db.insert(placeTable).values(restaurants);

  // If you want to log what was created:
  console.log(`Inserted ${restaurants.length} rows into ${placeTable.name ?? "place"}`);
}

seed()