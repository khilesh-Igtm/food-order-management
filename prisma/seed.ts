import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const sampleMenuItems: Array<{
  name: string;
  description: string;
  price: Prisma.Decimal;
  imageUrl: string;
}> = [
  {
    name: "Classic Margherita Pizza",
    description:
      "San Marzano tomato sauce, fresh mozzarella, aromatic basil, and cold-pressed extra virgin olive oil on hand-stretched dough.",
    price: new Prisma.Decimal("14.99"),
    imageUrl:
      "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Truffle Mushroom Burger",
    description:
      "Grass-fed beef patty, sauteed wild forest mushrooms, melted Swiss cheese, and black truffle garlic aioli on a toasted brioche bun.",
    price: new Prisma.Decimal("16.99"),
    imageUrl:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Spicy Pepperoni Rustica",
    description:
      "Zesty tomato sauce, artisanal pepperoni slices, smoked provolone, and hot pepper flakes with crispy crust.",
    price: new Prisma.Decimal("17.50"),
    imageUrl:
      "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Caesar Salad with Crispy Croutons",
    description:
      "Crisp romaine hearts, shaved 24-month Parmigiano-Reggiano, house-made herb croutons, and creamy roasted garlic Caesar dressing.",
    price: new Prisma.Decimal("11.50"),
    imageUrl:
      "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Fettuccine Alfredo with Grilled Chicken",
    description:
      "Tender grilled chicken breast served over freshly rolled egg fettuccine in a velvety parmesan and butter emulsion.",
    price: new Prisma.Decimal("18.25"),
    imageUrl:
      "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Smoked Bacon Cheeseburger",
    description:
      "Prime Angus beef, applewood-smoked bacon, melted aged cheddar, crisp butter lettuce, vine-ripened tomato, and house burger spread.",
    price: new Prisma.Decimal("15.75"),
    imageUrl:
      "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Crispy Korean Fried Chicken Wings",
    description:
      "Double-fried crispy jumbo wings glazed with sweet and spicy gochujang sauce, toasted sesame seeds, and pickled radish.",
    price: new Prisma.Decimal("13.99"),
    imageUrl:
      "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Warm Chocolate Molten Lava Cake",
    description:
      "Rich dark chocolate cake with a molten center of warm Belgian chocolate, served with vanilla bean whip.",
    price: new Prisma.Decimal("8.99"),
    imageUrl:
      "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80",
  },
];

async function main() {
  console.log("Seeding menu items into database...");

  for (const item of sampleMenuItems) {
    const existing = await prisma.menuItem.findFirst({
      where: { name: item.name },
    });

    if (existing) {
      await prisma.menuItem.update({
        where: { id: existing.id },
        data: item,
      });
      console.log(`Updated: ${item.name}`);
    } else {
      await prisma.menuItem.create({
        data: item,
      });
      console.log(`Created: ${item.name}`);
    }
  }

  const count = await prisma.menuItem.count();
  console.log(`Seeding completed. Total menu items in database: ${count}`);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
