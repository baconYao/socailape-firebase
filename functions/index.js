const functions = require('firebase-functions');

const app = require('express')();

// handlers
const { 
  getAllScreams,
  postOneScream,
  getScream,
  commentOnScream,
  likeScream,
  unlikeScream,
  deleteScream
} = require('./handlers/scream');
const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser } = require('./handlers/user');
// middlewares
const fbAuth = require('./util/fbAuth');

// Scream routes
app.get('/screams', getAllScreams);
app.post('/screams', fbAuth, postOneScream);
app.get('/scream/:screamId', getScream);
app.delete('/scream/:screamId', fbAuth, deleteScream);
app.post('/scream/:screamId/like', fbAuth, likeScream);
app.post('/scream/:screamId/unlike', fbAuth, unlikeScream);
app.post('/scream/:screamId/comment', fbAuth, commentOnScream);

// Users routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', fbAuth, uploadImage);
app.post('/user', fbAuth, addUserDetails);
app.get('/user', fbAuth, getAuthenticatedUser);

// https://baseurl.com/api/
// 若不指定 function 要被 deploy 到哪個 region，則預設會是 us-central1
exports.api = functions.region('asia-east2').https.onRequest(app);