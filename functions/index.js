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
const { 
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsread
} = require('./handlers/user');
const { db } = require("./util/admin");
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
app.get('/user/:handle', getUserDetails);
app.post('/notifications', fbAuth, markNotificationsread);

// https://baseurl.com/api/
// 若不指定 function 要被 deploy 到哪個 region，則預設會是 us-central1
const REGION = 'asia-east2'
exports.api = functions.region(REGION).https.onRequest(app);

// Cloud Firestore trigers
// https://firebase.google.com/docs/functions/firestore-events
// https://github.com/baconYao/React-Redux-Firebase/tree/master/functions
/*
  當有人對某篇 scream 按 like 時，會在 notifications collections內新增按讚的訊息
*/ 
exports.createNotificationOnLike = functions
  .region(REGION)
  .firestore.document('likes/{id}')
  .onCreate((snapshot) => {
    db.doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        if(doc.exists) {
          // 新增 record 至 notification
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,     // 收件者，就是 scream 的主人
            sender: snapshot.data().userHandle,   // 寄送者，就是按 like 的人
            type: 'like',
            read: false,                          // 表示 scream 的主人還沒看過這個 like
            screamId: doc.id
          })
        }
        return;
      })
      .then(() => {
        return;
      })
      .catch(err => {
        console.error(err);
        return;
      });
  });

/*
  當有人對某篇 scream unlike (收回) 時，會在 notifications collections內移除按讚的訊息
*/ 
exports.deleteNotificationOnUnLike = functions
  .region(REGION)
  .firestore.document('likes/{id}')
  .onDelete((snapshot) => {
    db.doc(`/notifications/${snapshot.id}`)
      .delete()
      .then(() => {
        return;
      })
      .catch(err => {
        console.error(err);
        return;
      });
  });

/*
  當有人發表 comment 在某篇 scream時，會在 notifications collections內新增按讚的訊息
*/ 
exports.createNotificationOnComment = functions
  .region(REGION)
  .firestore.document('comments/{id}')
  .onCreate((snapshot) => {
    db.doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        if(doc.exists) {
          // 新增 record 至 notification
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,     // 收件者，就是 scream 的主人
            sender: snapshot.data().userHandle,   // 寄送者，就是按 like 的人
            type: 'comment',
            read: false,                          // 表示 scream 的主人還沒看過這個 comment
            screamId: doc.id
          })
        }
        return;
      })
      .then(() => {
        return;
      })
      .catch(err => {
        console.error(err);
        return;
      });
  });