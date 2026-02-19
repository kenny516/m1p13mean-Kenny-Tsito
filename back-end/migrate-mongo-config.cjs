const dotenv = require('dotenv')
dotenv.config()

module.exports = {
  mongodb: {
    url: process.env.MONGO_URI || 'mongodb://localhost:27017/marketplace',
    databaseName: process.env.MONGO_DB_NAME || process.env.DB_NAME || 'marketplace',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  migrationsDir: 'migrations',
  migrationFileExtension: '.cjs',
  changelogCollectionName: 'migrations',
}
