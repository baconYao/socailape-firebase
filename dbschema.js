// 存在 firestore 內的 collection & properties
let db = {
  users: [
    {
      userId: 'uhdnscndksm',
      email: 'test@mail.com',
      handle: 'test',
      createdAt: '2020-02-18T15:26:19.737Z',
      imageUrl: 'image/aksjdhjcndsj/eifjnc',
      bio: 'Hello, my name is test, nice to meet you',
      website: 'https://test.com',
      location: 'Taiwan'
    }
  ],
  screams: [
    {
      userHandle: 'user',
      body: 'this is the scream body',
      createdAt: '2020-02-18T15:26:19.737Z',
      likeCount: 5,
      commentCount: 2
    }
  ],
  comments: [
    {
      userHandle: 'user',
      screamId: "saihdc248192",
      body: 'nice one mate!',
      createdAt: '2020-02-18T15:26:19.737Z',
    }
  ]
}

let userDetails = {
  // Redux data
  credentials: [
    {
      userId: 'uhdnscndksm',
      email: 'test@mail.com',
      handle: 'test',
      createdAt: '2020-02-18T15:26:19.737Z',
      imageUrl: 'image/aksjdhjcndsj/eifjnc',
      bio: 'Hello, my name is test, nice to meet you',
      website: 'https://test.com',
      location: 'Taiwan'
    }
  ],
  likes: [
    {
      userHandle: 'user',
      screamId: 'daksdkjsm322',
    },
    {
      userHandle: 'user',
      screamId: 'oeomnir3',
    }
  ]
}