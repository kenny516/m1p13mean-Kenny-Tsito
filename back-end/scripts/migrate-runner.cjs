#!/usr/bin/env node
const migrateMongo = require('migrate-mongo');

const action = process.argv[2];
(async () => {
  try {
    if (action === 'create') {
      const name = process.argv[3] || 'unnamed';
      const file = await migrateMongo.create(name);
      console.log('Created migration:', file);
      process.exit(0);
    }

    // Charger la config CommonJS (évite les problèmes avec "type": "module")
    try {
      const config = require('../migrate-mongo-config.cjs');
      migrateMongo.config.set(config);
    } catch (e) {
      // si non trouvé, continuer et laisser migrate-mongo chercher le fichier
    }

    const { db, client } = await migrateMongo.database.connect();

    if (action === 'status') {
      const res = await migrateMongo.status(db);
      console.table(res);
    } else if (action === 'up') {
      const migrated = await migrateMongo.up(db, client);
      console.log('Migrated:', migrated);
    } else if (action === 'down') {
      const rolled = await migrateMongo.down(db, client);
      console.log('Rolled back:', rolled);
    } else {
      console.log('Usage: node scripts/migrate-runner.cjs <status|up|down|create> [name]');
      process.exit(1);
    }

    if (client && client.close) await client.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
