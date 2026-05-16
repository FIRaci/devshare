import { db } from './src/db';
async function main() {
  const posts = await db.post.findMany({ select: { id: true, mediaUrl: true }, orderBy: { createdAt: 'desc' }, take: 5 });
  console.log("Posts:");
  console.dir(posts);
}
main().finally(() => process.exit(0));
