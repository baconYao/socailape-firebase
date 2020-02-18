const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(require('./key/admin.json'))
});

const express = require('express');
const app = express();

app.get('/screams', (req, res) => {
  admin
  .firestore()
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
  
  admin
    .firestore()
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

// https://baseurl.com/api/
// 若不指定 function 要被 deploy 到哪個 region，則預設會是 us-central1
exports.api = functions.region('asia-east2').https.onRequest(app);