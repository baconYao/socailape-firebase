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
    return db.doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        // 確認scream存在，且避免自己按 like 也會收到通知
        if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
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
      .catch(err => console.error(err));
  });

/*
  當有人對某篇 scream unlike (收回) 時，會在 notifications collections內移除按讚的訊息
*/ 
exports.deleteNotificationOnUnLike = functions
  .region(REGION)
  .firestore.document('likes/{id}')
  .onDelete((snapshot) => {
    return db.doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch(err => console.error(err));
  });

/*
  當有人發表 comment 在某篇 scream時，會在 notifications collections內新增按讚的訊息
*/ 
exports.createNotificationOnComment = functions
  .region(REGION)
  .firestore.document('comments/{id}')
  .onCreate((snapshot) => {
    return db.doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        // 確認scream存在，且避免自己回 comment 也會收到通知
        if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
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
      .catch(err => console.error(err));
  });

/*
  使用者更新其照片時，要將他所有 scream 內的 userImage url 一併更新
*/
exports.onUserChangeImage = functions
  .region(REGION)
  .firestore.document('users/{userId}')
  .onUpdate((change) => {
    console.log(change.before.data());
    console.log(change.after.data());
    if(change.before.data().imageUrl !== change.after.data().imageUrl) {
      console.log('Image has changed');
      const batch = db.batch();
      return db
        .collection('screams')
        .where('userHandle', '==', change.before.data().handle)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            const scream = db.doc(`/screams/${doc.id}`);
            batch.update(scream, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        })
        .catch((err) => console.error(err));
    }
    return true;
  });

/*
  使用者更刪除其 scream 時，要將所有和此 scream 關聯內的 like, comments and notifications 一併刪除
*/
exports.onScreamDelete = functions
  .region(REGION)
  .firestore.document('screams/{screamId}')
  .onDelete((snapshot, context) => {
    const screamId = context.params.screamId;
    const batch = db.batch();
    return db.collection('comments').where('screamId', '==', screamId).get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db.collection('likes').where('screamId', '==', screamId).get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db.collection('notifications').where('screamId', '==', screamId).get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch((err) => console.error(err));
  })