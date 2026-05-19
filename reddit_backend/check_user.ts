import { db } from './src/db';
db.user.findFirst({ where: { username: 'FIRaci' } }).then(u => {
  if (u) {
    console.log("Avatar:", u.avatarUrl);
    console.log("Banner:", u.bannerUrl);
  } else {
    console.log("User not found");
  }
}).finally(() => process.exit(0));
