const db = require('../db/db');
const config = require('../db/config');

async function testConnection() {
  try {
    console.log(`Mode de base de données actuel: ${config.useMongoDb ? 'MongoDB' : 'SQLite'}`);
    
    // Test de récupération des produits
    console.log('Récupération des produits...');
    const products = await db.getAllProducts();
    console.log(`Nombre de produits: ${products.length}`);
    console.log('Premier produit:', products[0]);
    
    // Test de récupération des utilisateurs
    console.log('\nRécupération d\'un utilisateur par email...');
    const user = await db.getUserByEmail('a@a');
    if (user) {
      console.log(`Utilisateur trouvé: ${user.first_name} ${user.last_name}`);
    } else {
      console.log('Aucun utilisateur trouvé avec cet email.');
    }
    
    console.log('\nTest de connexion réussi!');
    
    // Fermer la connexion si nécessaire
    if (!config.useMongoDb) {
      await db.close();
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors du test de connexion:', error);
    process.exit(1);
  }
}

testConnection(); 