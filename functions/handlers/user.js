const firebase = require('firebase');

const { db, admin } = require('../util/admin');
const config = require('../util/config');

// Initialize Firebase
firebase.initializeApp(config);

const { validateSignupData, validateLoginData, reduceUserDetails } = require('../util/validators');

exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  }

  const { valid, errors } = validateSignupData(newUser);

  if(!valid) {
    return res.status(400).json(errors);
  }

  const noImg = 'no-img.png';

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
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
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
}


exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  }

  const { valid, errors } = validateLoginData(user);

  if(!valid) {
    return res.status(400).json(errors);
  }

  firebase.auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((data) => {
      return data.user.getIdToken();
    })
    .then((token) => {
      return res.json({token});
    })
    .catch((err) => {
      console.error(err);
      if(err.code === 'auth/wrong-password') {
        return res.status(403).json({ general: 'Wrong credentials, please try again.' })
      }
      return res.status(500).json({ error: err.code })
    })
}


// Add user details
exports.addUserDetails = (req, res) => {
  let userDetails = reduceUserDetails(req.body);

  db.doc(`/users/${req.user.handle}`).update(userDetails)
    .then(() => {
      return res.json({ message: 'Details added successfully' });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
}


// Get own user details
exports.getAuthenticatedUser = (req, res) => {
  let userData = {};
  db.doc(`/users/${req.user.handle}`).get()
    .then(doc => {
      if(doc.exists) {
        userData.crendentials = doc.data();
      }
      return db.collection('likes').where('userHandle', '==', req.user.handle).get();
    })
    .then(data => {
      userData.likes = [];
      data.forEach(doc => {
        userData.likes.push(doc.data());
      });
      return res.json(userData);
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
}


exports.uploadImage = (req, res) => {
  const Busboy = require('busboy');
  const path = require('path');
  const os = require('os');
  const fs = require('fs');

  const busboy = new Busboy({ headers: req.headers });

  let imageFileName;
  let imageToBeUploaded = {};

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    console.log("0)))))))))")
    console.log(fieldname);    // form 的 field 名稱 
    console.log(filename);
    console.log(mimetype);
    if(mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
      return res.status(400).json({ error: 'Wrong file type submitted' });
    }
    // my.image.png => ['my', 'image', 'png']
    const imageExtension = filename.split('.')[filename.split('.').length -1 ];
    // 483759232212.png
    imageFileName = `${Math.round(Math.random()*100000000000)}.${imageExtension}`;
    // 此 filepath 會存在本機的 /var/folders，雖然是暫存的(30天後自動刪除)，但感覺要佔空間，就不妥。
    const filepath = path.join(os.tmpdir(), imageFileName);
    // console.log(filepath)
    imageToBeUploaded = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });
  
  busboy.on('finish', () => {
    admin.storage().bucket(`${config.storageBucket}`).upload(imageToBeUploaded.filepath, {
      resumable: false,
      metadtata: {
        metatdat: {
          contentType: imageToBeUploaded.mimetype
        }
      }
    })
    .then(() => {
      // alt=media 會將 image show 在 browser，若不給予，則會直接下載
      const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`
      return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
    })
    .then(() => {
      return res.json({ message: 'Image uploaded successfully' });
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    })
  });
  busboy.end(req.rawBody);
}