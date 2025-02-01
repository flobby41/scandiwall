const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

function initialize(passport, getUserByEmail, getUserById) {
  const authenticateUser = async (email, password, done) => {
    getUserByEmail(email, async (err, user) => {
      if (err) return done(err);
      if (!user) return done(null, false, { message: 'No user with this email' });

      try {
        if (await bcrypt.compare(password, user.password)) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'password incorrect' });
        }
      } catch (e) {
        return done(e);
      }
    });
  };

  passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser));

  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser((id, done) => {
    getUserById(id, (err, user) => {
      if (err) return done(err);
      if (!user) return done(new Error('Utilisateur non trouvé'));
      return done(null, user);
    });
  });
}

module.exports = initialize;