const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

initializeApp({ projectId: "zero-downtime-ai-509413" });
const auth = getAuth();

const users = [
  ["MxXGCrHkbocBzcP9HadvoXaHgqq1","user@automotion.demo","standard","automotion"],
  ["cwmSvjVdSVW5GdTRrmnmBUshf103","admin@automotion.demo","client_admin","automotion"],
  ["eqqUg3PxQdMpXWErl9heYZ2wMIj1","user@packpro.demo","standard","packpro"],
  ["wleSuh9MR4gheXKMmIMsOCzbY4H3","admin@packpro.demo","client_admin","packpro"],
  ["rNDouhPaofNWoIjqAeEAlQRJax62","user@freshline.demo","standard","freshline"],
  ["GQGQxjngRkW06und8w47UZH4D2k1","admin@freshline.demo","client_admin","freshline"],
  ["MVh5soO72WeZOk6cRdsyQ6bmDrA2","user@flowcore.demo","standard","flowcore"],
  ["NkVBzSoebde0qxm8LGGDQ4LLrYH3","admin@flowcore.demo","client_admin","flowcore"],
  ["kVxtUA7hCqgy6tNEHyTia9hlOe72","superadmin@zerodowntime.demo","super_admin","GLOBAL"]
];

async function main() {
  for (const [uid, email, role, client_id] of users) {
    await auth.setCustomUserClaims(uid, { role, client_id });
    console.log(`Claims set: ${email} -> ${role}, ${client_id}`);
  }
  console.log("Done. Custom claims applied to all 9 users.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
