import { db } from "./src/db";

async function main() {
  const existing = await db.user.findUnique({ where: { username: 'devshare_admin' } });
  if (existing) {
    await db.user.delete({ where: { id: existing.id } });
    console.log('Removed existing admin user');
  }

  const password = await Bun.password.hash('pass123');
  const user = await db.user.create({
    data: {
      username: 'devshare_admin',
      email: 'admin@devshare.dev',
      password,
      role: 'ADMIN',
    },
  });
  console.log(`Admin user created: ${user.username} (id: ${user.id})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
