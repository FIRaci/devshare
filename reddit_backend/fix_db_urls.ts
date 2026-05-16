import { db } from './src/db';

async function fixUrls() {
  const posts = await db.post.findMany({
    where: {
      mediaUrl: { contains: 'http://localhost:3001' }
    }
  });

  for (const post of posts) {
    if (post.mediaUrl) {
      const newUrl = post.mediaUrl.replace('http://localhost:3001', 'https://devshare-production-6c8c.up.railway.app');
      await db.post.update({
        where: { id: post.id },
        data: { mediaUrl: newUrl }
      });
      console.log(`Updated post ${post.id}`);
    }
  }

  const users = await db.user.findMany({
    where: {
      avatarUrl: { contains: 'http://localhost:3001' }
    }
  });

  for (const user of users) {
    if (user.avatarUrl) {
      const newUrl = user.avatarUrl.replace('http://localhost:3001', 'https://devshare-production-6c8c.up.railway.app');
      await db.user.update({
        where: { id: user.id },
        data: { avatarUrl: newUrl }
      });
      console.log(`Updated user ${user.id}`);
    }
  }
  
  console.log("Done fixing URLs");
}

fixUrls().finally(() => process.exit(0));
