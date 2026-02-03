import app from "./app.js";
import config from "./src/config/env.js";
import connectDB from "./src/config/db.js";

/**
 * Point d'entrée de l'application
 * Initialise la connexion à la base de données et démarre le serveur
 */
const startServer = async () => {
  try {
    // Connexion à MongoDB
    await connectDB();

    // Démarrage du serveur
    app.listen(config.port, () => {
      console.log(`
🚀 ============================================
   Serveur démarré avec succès!
   ============================================
   📍 URL: http://localhost:${config.port}
   🔧 Environnement: ${config.nodeEnv}
   📦 API: http://localhost:${config.port}/api
   ============================================
      `);
    });
  } catch (error) {
    console.error("❌ Erreur lors du démarrage du serveur:", error.message);
    process.exit(1);
  }
};

// Gestion des erreurs non capturées
process.on("unhandledRejection", (err) => {
  console.error("❌ Erreur non gérée:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Exception non capturée:", err);
  process.exit(1);
});

// Démarrer le serveur
startServer();
