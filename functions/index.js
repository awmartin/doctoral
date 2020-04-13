const functions = require('firebase-functions');
const admin = require('firebase-admin')
admin.initializeApp()

const db = admin.firestore()
const storage = admin.storage()
const bucket = storage.bucket()

const _ = require('lodash')

const createHtmlFromTemplate = (userDisplayName, title, body) => {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">

    <title>${title}</title>
    <meta name="description" content="">
    <meta name="author" content="${userDisplayName}">

    <link rel="stylesheet" href="https://firebasestorage.googleapis.com/v0/b/doctoral-460ba.appspot.com/o/public%2Fpublished.css?alt=media">
  </head>

  <body>
    <h1>${title}</h1>

    <div class="content">
      ${body}
    </div>
  </body>
</html>
`
}

const createPostFromDocument = (username, userDisplayName, slug, doc) => {
  const filePath = `posts/${username}/${slug}.html`
  const file = bucket.file(filePath)

  const streamOptions = {
    resumable: false,
    contentType: 'text/html'
  }
  const stream = file.createWriteStream(streamOptions)
  
  const html = createHtmlFromTemplate(userDisplayName, doc.title, doc.content)
  return new Promise((resolve, reject) => {
    stream.write(html)
    stream.on('finish', resolve)
    stream.on('error', reject)
    stream.end()
  })
}

const getUsername = (userId) => {
  const userDataRef = db.collection('data').doc(userId)
  return userDataRef.get().then(doc => {
    if (doc.exists) {
      return doc.data().username
    } else {
      return null
    }
  })
}

exports.publishDocument = functions.https.onCall((data, context) => {
  if (_.isNil(context.auth)) {
    throw new functions.https.HttpsError('unauthenticated', "You must be authenticated to publish.")
  }
  if (!_.has(data, 'slug')) {
    throw new functions.https.HttpsError('failed-precondition', "Desired post slug not specified in request.")
  }
  if (!_.has(data, 'documentId')) {
    throw new functions.https.HttpsError('failed-precondition', "ID of document to publish not specified in request.")
  }

  const documentId = data.documentId
  const userId = context.auth.uid
  const displayName = context.auth.displayName
  const documentRef = db.collection('data').doc(userId).collection('documents').doc(documentId)

  let document = null
  documentRef.get().then(doc => {
    if (doc.exists) {
      document = doc.data()
      console.debug(`Document found ${userId} ${documentId} ${document.title}`)
      return getUsername(userId)
    } else {
      throw new functions.https.HttpsError('not-found', "Document not found.")
    }
  }).then(username => {
    if (_.isNil(username)) {
      throw new functions.https.HttpsError('failed-precondition', "User not found.")
    }
    return createPostFromDocument(username, displayName, data.slug, document)
  }).then(() => {
    return { message: `Published document ${data.slug}` }
  }).catch(error => {
    console.error('An error occurred while publishing', error)
    return { message: error }
  })
})

exports.posts = functions.https.onRequest((req, res) => {
  const filePath = _.replace(req.path, '/', '')
  console.debug('Looking for file', filePath)

  const file = bucket.file(filePath)
  if (!file.exists()) {
    res.status(404).send('Storage resource not found.')
    return { message: 'Storage resource not found.' }
  }

  console.debug('Opening the readable stream for', filePath)
  const rs = file.createReadStream()
  const chunks = []

  const reader = new Promise((resolve, reject) => {
    rs.on('data', chunk => {
      chunks.push(chunk)
    })

    rs.on('end', () => {
      const html = Buffer.concat(chunks).toString('utf8')
      resolve(html)
    })

    rs.on('error', error => {
      reject(error)
    })
  })

  return reader.then(html => {
    res.status(200).send(html)
    return { message: "Post sent." }
  })
  .catch(error => {
    res.status(500).send('Internal server error.')
  })
})
