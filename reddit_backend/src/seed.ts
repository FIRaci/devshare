import { db as prisma } from "./db";

async function main() {
  const hashedPassword = await Bun.password.hash('password123');
  const user = await prisma.user.upsert({
    where: { username: 'devshare_admin' },
    update: { role: 'ADMIN', password: hashedPassword },
    create: {
      username: 'devshare_admin',
      email: 'admin@devshare.dev',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  // Create default communities
  const announcements = await prisma.subreddit.upsert({
    where: { name: 'announcements' },
    update: {},
    create: {
      name: 'announcements',
      description: 'The latest news and updates from DevShare',
    },
  })

  const webdev = await prisma.subreddit.upsert({
    where: { name: 'webdev' },
    update: {},
    create: {
      name: 'webdev',
      description: 'Everything about web development',
    },
  })

  const typescript = await prisma.subreddit.upsert({
    where: { name: 'typescript' },
    update: {},
    create: {
      name: 'typescript',
      description: 'TypeScript tips, tricks, and discussions',
    },
  })

  // Create sample posts
  await prisma.post.create({
    data: {
      title: 'Welcome to DevShare!',
      content: 'DevShare is your community hub for developers. Share ideas, vote on content, and connect with devs worldwide. Built with Bun, Elysia, Prisma and React.',
      authorId: user.id,
      subredditId: announcements.id,
    },
  })

  await prisma.post.create({
    data: {
      title: 'Getting started with DevShare',
      content: 'Just run run.bat and you are good to go! Make sure Docker Desktop is running first. The app starts at http://localhost:5173.',
      authorId: user.id,
      subredditId: announcements.id,
    },
  })

  await prisma.post.create({
    data: {
      title: 'Why TypeScript is a must in 2025',
      content: 'TypeScript has become the standard for large-scale JavaScript projects. Type safety, better tooling, and improved developer experience make it essential.',
      authorId: user.id,
      subredditId: typescript.id,
    },
  })

  await prisma.post.create({
    data: {
      title: 'Bun vs Node.js — Performance Comparison',
      content: 'Bun is significantly faster than Node.js in most benchmarks. Its built-in bundler, transpiler, and package manager make it a compelling all-in-one solution.',
      authorId: user.id,
      subredditId: webdev.id,
    },
  })

  console.log('DevShare seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
