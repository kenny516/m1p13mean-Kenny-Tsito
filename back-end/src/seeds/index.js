import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const backendRoot = resolve(__dirname, "../..");

const seeds = [
  { name: "admin", file: "src/seeds/admin.seed.js" },
  { name: "buyer", file: "src/seeds/buyer.seed.js" },
  { name: "shop", file: "src/seeds/shop.seed.js" },
  { name: "product", file: "src/seeds/product.seed.js" },
  { name: "wallet", file: "src/seeds/wallet.seed.js" },
  { name: "stockMovement", file: "src/seeds/stockMovement.seed.js" },
];

console.log("🌱 Running all seeds in order...\n");

for (const seed of seeds) {
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`▶️  Running seed: ${seed.name}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  try {
    execSync(`node ${seed.file}`, {
      cwd: backendRoot,
      stdio: "inherit",
    });
    console.log(`✅ ${seed.name} seed completed\n`);
  } catch (error) {
    console.error(`❌ ${seed.name} seed failed (exit code ${error.status})`);
    process.exit(1);
  }
}

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🎉 All seeds completed successfully!");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
