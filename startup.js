const token = process.env.DISCORD_TOKEN?.trim();

process.on("unhandledRejection", error => {
  console.error("❌ Promesa rechazada sin manejar:", error);
  process.exitCode = 1;
});

process.on("uncaughtException", error => {
  console.error("❌ Excepción no controlada:", error);
  process.exit(1);
});

if (!token) {
  console.error("❌ Falta DISCORD_TOKEN en las variables de entorno de Render.");
  process.exit(1);
}

console.log("🚀 Iniciando Fusake...");
require("./index.js");
