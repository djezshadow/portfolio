import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("Uso: npx tsx scripts/hash-password.ts \"tuPasswordSegura\"");
  process.exit(1);
}

bcrypt.hash(password, 12).then((hash) => {
  console.log("\nPegá esto en tu .env como ADMIN_PASSWORD_HASH:\n");
  console.log(hash);
  console.log("");
});
