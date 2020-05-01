import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import 'firebase/analytics'
import 'firebase/functions'

import converters from './firebaseConverters'

const _ = require('lodash')

class FirebaseBackend {
  constructor (config) {
    firebase.initializeApp(config)

    this.config = config
    this.db = firebase.firestore()
    this.functions = firebase.functions()
    this.auth = firebase.auth()
    this.googleAuthProvider = new firebase.auth.GoogleAuthProvider()
  }

  // ============================== AUTHENTICATION ==============================

  registerAuthCallback (onLoggedIn, onNotLoggedIn) {
    this.auth.onAuthStateChanged(user => {
      if (user) {
        onLoggedIn(user)
      } else {
        onNotLoggedIn()
      }
    })
  }

  authorize () {
    this.auth.signInWithRedirect(this.googleAuthProvider)
  }

  deauthorize () {
    return this.auth.signOut()
  }

  // ======================================== USER ========================================

  getCurrentUser () {
    return this.auth.currentUser
  }

  updateUser (data) {
    // TODO Put some constraints on the data that can be updated here.
    const uid = this.getCurrentUser().uid
    const userRef = this.db.collection('data').doc(uid)
    return userRef.update(data)
  }

  // ======================================== CONTENT LISTENERS ========================================

  registerContentsListener (onUpdate) {
    const contentsRef = this.getCollection('contents')
    return contentsRef
      .withConverter(converters.ContentConverter)
      .where('trashed', '==', false)
      .onSnapshot(snapshot => {
        const contents = []

        snapshot.forEach(doc => {
          contents.push(doc.data())
        })

        onUpdate(contents)
      })
  }

  registerTrashListener (onUpdate) {
    return this.getCollection('contents')
      .withConverter(converters.ContentConverter)
      .where('trashed', '==', true)
      .onSnapshot(snapshot => {
        const items = []

        snapshot.forEach(doc => {
          items.push(doc.data())
        })

        onUpdate(items)
      })
  }

  registerUserStateListener (onUpdate) {
    const user = this.getCurrentUser()
    if (_.isNil(user)) {
      console.error('Attempted to subscribe to user data but did not have a user to listen to!')
      return
    }

    const userRef = this.db.collection('data').doc(user.uid)

    return userRef.onSnapshot(snapshot => {
      const userData = snapshot.data()
      onUpdate(userData)
    })
  }

  // ======================================== CONTENT QUERIES ========================================

  getCollection (key) {
    const user = this.getCurrentUser()
    return this.db.collection('data').doc(user.uid).collection(key)
  }

  // ============================== CONTENT + DOCUMENT CRUD OPERATIONS ==============================

  // Used to acquire a new ID for table-of-contents creation.
  provisionNewContentReference () {
    return new Promise(resolve => {
      const contentRef = this.getCollection('contents').doc()
      resolve(contentRef)
    })
  }

  // Used to acquire a new ID for document creation.
  provisionNewDocumentReference () {
    return new Promise(resolve => {
      const documentRef = this.getCollection('documents').doc()
      resolve(documentRef)
    }) 
  }

  createContent (content, parent, batch_ = null) {
    const batch = batch_ ? batch_ : this.db.batch()

    const newContentRef = this.getCollection('contents').doc(content.id)
    const newContentData = converters.ContentConverter.toFirestore(content)
    batch.set(newContentRef, newContentData)

    this.updateContent(parent, batch)

    if (_.isNil(batch_)) {
      return batch.commit().then(() => {
        return content
      })
    }
  }

  updateContent (content, batch_ = null) {
    if (_.isNil(content) || (_.isObject(content) && _.isNil(content.id))) { return }

    const items = _.isArray(content) ? _.filter(content) : _.filter([content])

    const batch = batch_ ? batch_ : this.db.batch()

    _.forEach(items, item => {
      if (_.isNil(item.id)) { return }

      const itemRef = this.getCollection('contents').doc(item.id)
      const itemData = converters.ContentConverter.toFirestore(item)

      batch.update(itemRef, itemData)
    })

    // If this method doesn't receive a batch object, it's likely being called to
    // engage the update process explicitly. So go ahead and update.
    if (_.isNil(batch_)) {
      return batch.commit()
    }
  }

  createDocument (document, parent) {
    const batch = this.db.batch()

    this.createContent(document.content, parent)

    const newDocumentRef = this.getCollection('documents').doc(document.id)
    const newDocumentData = converters.DocumentConverter.toFirestore(document)
    batch.set(newDocumentRef, newDocumentData)

    return batch.commit().then(() => {
      return document
    })
  }

  updateDocument (document) {
    const batch = this.db.batch()

    const documentData = converters.DocumentConverter.toFirestore(document)
    const documentRef = this.getCollection('documents').doc(document.id)
    batch.update(documentRef, documentData)

    this.updateContent(document.content, batch)

    return batch.commit()
  }

  loadDocument (documentKey) {
    const documentRef = this.getCollection('documents').doc(documentKey)

    return documentRef.withConverter(converters.DocumentConverter)
      .get()
      .then(doc => {
        return doc.exists ? doc.data() : null
      })
  }

  publishDocument (document, slug) {
    const args = {
      documentId: document.id,
      slug
    }

    const publish = this.functions.httpsCallable('publishDocument')
    return publish(args)
  }

  delete (items) {
    if (_.isEmpty(items)) { return new Promise(resolve => {
        resolve()
      })
    }

    const batch = this.db.batch()

    _.forEach(items, item => {
      if (item.operation === 'DELETE') {
        const contentRef = this.getCollection('contents').doc(item.content.id)
        batch.delete(contentRef)
  
        if (item.content.isDocument()) {
          const documentRef = this.getCollection('documents').doc(item.content.key)
          batch.delete(documentRef)
        }
      } else if (item.operation === 'UPDATE') {
        const itemData = converters.ContentConverter.toFirestore(item.content)
        const contentRef = this.getCollection('contents').doc(item.content.id)
        batch.update(contentRef, itemData)
      }
    })

    return batch.commit()
  }
}

export default FirebaseBackend
