const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

// Configuration par défaut
const config = {
  // Par défaut, utiliser MongoDB
  useMongoDb: process.env.USE_MONGODB !== 'false', // true par défaut sauf si explicitement défini à 'false'
};

module.exports = config; 