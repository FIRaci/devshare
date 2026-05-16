fetch("https://devshare-production-6c8c.up.railway.app/uploads/1778928071117.mp4", { method: 'HEAD' }).then(r => console.log(r.status)).catch(console.error);
