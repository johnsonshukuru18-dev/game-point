import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Game Point...");

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: "FOOTBALL" },
      update: {},
      create: { name: "FOOTBALL", emoji: "⚽" },
    }),
    prisma.category.upsert({
      where: { name: "SHOOTER" },
      update: {},
      create: { name: "SHOOTER", emoji: "🔫" },
    }),
    prisma.category.upsert({
      where: { name: "OPEN_WORLD" },
      update: {},
      create: { name: "OPEN_WORLD", emoji: "🌆" },
    }),
    prisma.category.upsert({
      where: { name: "RACING" },
      update: {},
      create: { name: "RACING", emoji: "🚗" },
    }),
  ]);

  const [football, shooter, openWorld, racing] = categories;

  const games = [
    { slug: "efootball", name: "eFootball", categoryId: football.id, accentFrom: "#3DA9FC", accentTo: "#28E4E0" },
    { slug: "dream-league-soccer", name: "Dream League Soccer", categoryId: football.id, accentFrom: "#3EE089", accentTo: "#28E4E0" },
    { slug: "ea-sports-fc", name: "EA SPORTS FC", categoryId: football.id, accentFrom: "#3EE089", accentTo: "#3DA9FC" },
    { slug: "call-of-duty", name: "Call of Duty", categoryId: shooter.id, accentFrom: "#FF4D6D", accentTo: "#FF7A45" },
    { slug: "call-of-duty-mobile", name: "Call of Duty Mobile", categoryId: shooter.id, accentFrom: "#FF4D6D", accentTo: "#A259FF" },
    { slug: "gta-v", name: "GTA V", categoryId: openWorld.id, accentFrom: "#A259FF", accentTo: "#28E4E0" },
    { slug: "gta-online", name: "GTA Online", categoryId: openWorld.id, accentFrom: "#A259FF", accentTo: "#3DA9FC" },
    { slug: "need-for-speed", name: "Need for Speed", categoryId: racing.id, accentFrom: "#FF7A45", accentTo: "#FF4D6D" },
    { slug: "asphalt", name: "Asphalt", categoryId: racing.id, accentFrom: "#FF7A45", accentTo: "#A259FF" },
  ];

  for (const g of games) {
    await prisma.game.upsert({ where: { slug: g.slug }, update: {}, create: g });
  }

  const efootball = await prisma.game.findUniqueOrThrow({ where: { slug: "efootball" } });
  const cod = await prisma.game.findUniqueOrThrow({ where: { slug: "call-of-duty" } });
  const gta = await prisma.game.findUniqueOrThrow({ where: { slug: "gta-v" } });

  const demoUsersData = [
    { username: "kelvin_gg", email: "demo1@gamepoint.demo", displayName: "Kelvin", gamerTag: "KelvinGG", games: [efootball, gta] },
    { username: "amina_plays", email: "demo2@gamepoint.demo", displayName: "Amina", gamerTag: "AminaStrikes", games: [efootball] },
    { username: "shadow_cod", email: "demo3@gamepoint.demo", displayName: "Shadow", gamerTag: "ShadowOps", games: [cod] },
  ];

  const demoPasswordHash = await bcrypt.hash("Demo1234!", 10);
  const demoUsers = [];
  for (const u of demoUsersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        username: u.username,
        email: u.email,
        passwordHash: demoPasswordHash,
        profile: {
          create: {
            displayName: u.displayName,
            gamerTag: u.gamerTag,
            bio: "Demo account seeded for Game Point — this is not a real player.",
            playStyle: "BOTH",
            wins: Math.floor(Math.random() * 20),
            losses: Math.floor(Math.random() * 15),
          },
        },
      },
    });
    for (const g of u.games) {
      await prisma.userGame.upsert({
        where: { userId_gameId: { userId: user.id, gameId: g.id } },
        update: {},
        create: { userId: user.id, gameId: g.id },
      });
    }
    demoUsers.push(user);
  }

  // Demo posts
  const existingPosts = await prisma.post.count();
  if (existingPosts === 0) {
    await prisma.post.create({
      data: {
        userId: demoUsers[0].id,
        gameId: efootball.id,
        caption: "[DEMO] Finally reached Division 1! 🔥",
      },
    });
    await prisma.post.create({
      data: {
        userId: demoUsers[2].id,
        gameId: cod.id,
        caption: "[DEMO] Clean 1v3 clutch on Nuketown. Clip incoming.",
      },
    });
  }

  console.log("Seed complete. Demo login: demo1@gamepoint.demo / Demo1234!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
