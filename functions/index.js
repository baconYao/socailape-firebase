const functions = require('firebase-functions');
const admin = require('firebase-admin');
const firebase = require('firebase');

const app = require('express')();

// firebase-admin vs firebase npm
// https://stackoverflow.com/questions/42958776/whats-the-difference-between-the-firebase-and-the-firebase-admin-npm-module
admin.initializeApp({
  credential: admin.credential.cert(require('./key/admin.json'))
});

const firebaseConfig = {
  apiKey: "AIzaSyDwVblCpzWKtUWmORjfuBejvjgMVm4P8NM",
  authDomain: "socialape-1d0c1.firebaseapp.com",
  databaseURL: "https://socialape-1d0c1.firebaseio.com",
  projectId: "socialape-1d0c1",
  storageBucket: "socialape-1d0c1.appspot.com",
  messagingSenderId: "585442796929",
  appId: "1:585442796929:web:ae955d0820515aff6e7480",
  measurementId: "G-95BP5GHF81"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// https://firebase.google.com/docs/firestore/quickstart#initialize
const db = admin.firestore();

app.get('/screams', (req, res) => {
  db
    .collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
    .then( data => {
      let screams = [];
      data.forEach( doc => {
        screams.push({
          screamId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt
        });
      })
      return res.json(screams);
    })
    .catch(
      err => console.error(err)
    )
});

app.post('/screams', (req, res) => { 
 const newScream = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString()
  };
  
  db
    .collection('screams')
    .add(newScream)
    .then( doc => {
      return res.json({ message: `document ${doc.id} created successfully` })
    })
    .catch( err => {
        res.status(500).json({ error: 'something went wrong' })
        console.error(err)
      }
    )
});

app.post('/signup', (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  }

  // TODO: validate data
  let token, userId;
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then((doc) => {
      if(doc.exists) {
        return res.status(400).json({ handle: 'This handle is already taken' })
      }
      return firebase
        .auth()
        .createUserWithEmailAndPassword(newUser.email, newUser.password)
    })
    .then((data) => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((idToken) => {
      token = idToken;

      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId
      }

      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch((err) => {
      console.error(err);
      if(err.code === 'auth/email-already-in-use') {
        return res.status(400).json({ email: 'Email is already in use' })
      }
      return res.status(500).json({ error: err.code })
    })
});

// https://baseurl.com/api/
// 若不指定 function 要被 deploy 到哪個 region，則預設會是 us-central1
exports.api = functions.region('asia-east2').https.onRequest(app);