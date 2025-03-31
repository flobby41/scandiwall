const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Charger les variables d'environnement depuis le fichier .env s'il existe
dotenv.config();

// URI de connexion à MongoDB (depuis les variables d'environnement)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skandiWall';

// Établir la connexion à MongoDB
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connexion à MongoDB établie avec succès');
    return mongoose.connection;
  } catch (err) {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);
  }
};

module.exports = {
  connectToMongoDB,
  mongoose
}; 