const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

function initialize(passport, getUserByEmail, getUserById) {
  const authenticateUser = async (email, password, done) => {
    try {
      const user = await getUserByEmail(email);
      
      if (!user) {
        return done(null, false, { message: 'Aucun utilisateur avec cet email' });
      }
      
      if (await bcrypt.compare(password, user.password)) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Mot de passe incorrect' });
      }
    } catch (err) {
      return done(err);
    }
  };

  passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser));

  passport.serializeUser((user, done) => {
    // Gérer à la fois les objets Mongoose et les objets SQLite
    const userId = user._id ? user._id.toString() : user.id;
    done(null, userId);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await getUserById(id);
      if (!user) {
        return done(new Error('Utilisateur non trouvé'));
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  });
}

module.exports = initialize;