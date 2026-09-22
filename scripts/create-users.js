const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp({ projectId: "zero-downtime-ai-509413" });
const db = getFirestore();

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
    await db.collection("users").doc(uid).set(
      { email, role, client_id, status: "active" },
      { merge: true }
    );
    console.log(`Created: ${email}`);
  }
  console.log("Done. 9 user documents created.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
