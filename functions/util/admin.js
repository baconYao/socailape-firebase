const admin = require('firebase-admin');

// firebase-admin vs firebase npm
// https://stackoverflow.com/questions/42958776/whats-the-difference-between-the-firebase-and-the-firebase-admin-npm-module
admin.initializeApp({
  credential: admin.credential.cert(require('../key/admin.json'))
});

// https://firebase.google.com/docs/firestore/quickstart#initialize
const db = admin.firestore();

module.exports = { admin, db };