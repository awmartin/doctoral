import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import 'firebase/analytics'
import 'firebase/functions'

import util from '@/lib/util'

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

  registerAuthCallback (onLoggedIn, onNotLoggedIn) {
    this.auth.onAuthStateChanged(user => {
      if (user) {
        onLoggedIn(user)
      } else {
        onNotLoggedIn()
      }
    })
  }

  registerContentsListener (onUpdate) {
    const contentsRef = this.getCollection('contents')
    return contentsRef.where('trashed', '==', false).onSnapshot(snapshot => {
      const contents = []
      snapshot.forEach(doc => {
        contents.push({ ...doc.data(), id: doc.id })
      })
      onUpdate(contents)
    })
  }

  registerTrashListener (onUpdate) {
    return this.getCollection('contents').where('trashed', '==', true).onSnapshot(snapshot => {
      const items = []

      snapshot.forEach(doc => {
        items.push({ ...doc.data(), id: doc.id })
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

  authorize () {
    this.auth.signInWithRedirect(this.googleAuthProvider)
  }

  deauthorize () {
    return this.auth.signOut()
  }

  getCurrentUser () {
    return this.auth.currentUser
  }

  updateUser (data) {
    // TODO Put some constraints on the data that can be updated here.
    const uid = this.getCurrentUser().uid
    const userRef = this.db.collection('data').doc(uid)
    return userRef.update(data)
  }

  getCollection (key) {
    const user = this.getCurrentUser()
    return this.db.collection('data').doc(user.uid).collection(key)
  }

  createDocument (folder, starred = false) {
    const now = new Date()

    const documentsRef = this.getCollection('documents')
    const newDocumentRef = documentsRef.doc()
    const newDocument = {
      title: 'Untitled Document',
      content: '',
      created: now,
      updated: now
    }

    const contentsRef = this.getCollection('contents')
    const newContentRef = contentsRef.doc()
    const newContent = {
      title: 'Untitled Document',
      key: newDocumentRef.id,
      type: 'Document',
      trashed: false,
      created: now,
      updated: now,
      parent: null,
      starred: false
    }

    // Customize the table-of-contents object for the current state.
    if (starred) {
      // If the user is looking at the starred items, create this document as starred.
      // And create it in the Home folder.
      newContent.starred = true
    } else if (_.isObject(folder)) {
      // Create the unstarred document in the folder that's open, if not starred.
      newContent.parent = folder.id
    }

    const batch = this.db.batch()

    // Create the document itself.
    batch.set(newDocumentRef, newDocument)

    // Create the requisite table-of-contents object.
    batch.set(newContentRef, newContent)

    // Update the target folder by adding a new child.
    if (_.isObject(folder)) {
      const targetFolderRef = this.getCollection('contents').doc(folder.id)

      if (_.isArray(folder.children)) {
        folder.children.push(newContentRef.id)
      } else {
        folder.children = [newContentRef.id]
      }

      batch.update(targetFolderRef, {
        children: folder.children,
        updated: now
      })
    }

    return batch.commit().then(() => {
      return {
        document: {
          ...newDocument,
          id: newDocumentRef.id
        },
        content: {
          ...newContent,
          id: newContent.id
        }
      }
    })
  }

  updateDocument (content, document, data) {
    const now = new Date()
    const documentData = {
      ...data,
      updated: now
    }

    const batch = this.db.batch()
    const documentRef = this.getCollection('documents').doc(document.id)
    batch.update(documentRef, documentData)

    const contentRef = this.getCollection('contents').doc(content.id)
    batch.update(contentRef, {
      title: documentData.title,
      updated: now
    })

    return batch.commit()
  }

  loadDocument (documentKey) {
    const documentRef = this.getCollection('documents').doc(documentKey)

    return documentRef.get().then(doc => {
      if (doc.exists) {
        const document = doc.data()
        document.id = doc.id
        return document
      } else {
        return null
      }
    })
  }

  trashDocument (documentContent) {
    const contentRef = this.getCollection('contents').doc(documentContent.id)
    const data = {
      trashed: true,
      updated: new Date()
    }
    return contentRef.update(data)
  }

  publishDocument (document) {
    const publish = this.functions.httpsCallable('publishDocument')
    const slug = _.toLower(util.getTitleUrl(document))
    const args = {
      documentId: document.id,
      slug
    }

    return publish(args)
  }

  createFolder (folder, starred) {
    const now = new Date()
    const newContent = {
      title: 'An Untitled Folder',
      type: 'Folder',
      children: [],
      trashed: false,
      created: now,
      updated: now,
      parent: null,
      starred: false
    }

    if (_.isObject(folder)) {
      newContent.parent = folder.id
    } else if (starred) {
      newContent.starred = true
    }

    const newContentRef = this.getCollection('contents').doc()

    const batch = this.db.batch()

    // Create the new table-of-contents entry.
    batch.set(newContentRef, newContent)

    // Update the target folder by adding a new child.
    if (_.isObject(folder)) {
      const targetFolderRef = this.getCollection('contents').doc(folder.id)

      if (_.isArray(folder.children)) {
        folder.children.push(newContentRef.id)
      } else {
        folder.children = [newContentRef.id]
      }

      batch.update(targetFolderRef, {
        children: folder.children,
        updated: now
      })
    }

    return batch.commit().then(() => {
      return {
        content: {
          ...newContent,
          id: newContentRef.id
        }
      }
    })
  } // createFolder

  updateFolder (folder, data) {
    const now = new Date()
    const folderData = {
      ...data,
      updated: now
    }
    const contentRef = this.getCollection('contents').doc(folder.id)
    return contentRef.update(folderData)
  }

  trashFolder (folder) {
    const contentRef = this.getCollection('contents').doc(folder.id)
    const data = {
      trashed: true,
      updated: new Date()
    }
    return contentRef.update(data)
  }

  toggleStar (content) {
    const contentRef = this.getCollection('contents').doc(content.id)
    const data = {
      starred: !content.starred,
      updated: new Date()
    }
    return contentRef.update(data)
  }

  moveContent (contentToMove, parentContent, destination) {
    const now = new Date()
    const batch = this.db.batch()

    // Remove the content key from the children of the original parent.
    if (_.isString(contentToMove.parent)) {
      const parentChildren = _.without(parentContent.children, contentToMove.id)

      const parentRef = this.getCollection('contents').doc(contentToMove.parent)
      batch.update(parentRef, {
        children: parentChildren,
        updated: now
      })
    }

    // Change the parent of the doc's content.
    const destinationId =  _.isNil(destination) ? null : destination.id

    const contentRef = this.getCollection('contents').doc(contentToMove.id)
    batch.update(contentRef, {
      parent: destinationId,
      updated: now
    })

    // Add the key to the new parent's children, if it's not the Home folder.
    const destinationIsFolderNotHome = !_.isNil(destination)
    if (destinationIsFolderNotHome) {
      const children = util.push(destination.children, contentToMove.id)

      const destinationRef = this.getCollection('contents').doc(destination.id)
      batch.update(destinationRef, {
        children,
        updated: now
      })
    }

    return batch.commit()
  }

  restore (content, parent) {
    if (_.isNil(content) || 
        (_.isObject(content) && _.isNil(content.id)) || 
        (_.isObject(content) && _.isObject(parent) && content.parent !== parent.id)) {
      return new Promise((restore, reject) => {
        reject('Attemtped to restore content but didn\'t get the info required.')
      })
    }

    const batch = this.db.batch()

    const now = new Date()
    const restoreData = {
      trashed: false,
      updated: now
    }

    // Check to see if the parent doesn't exist or is also trashed.
    // If not, then restore to the home folder.
    const parentNoLongerExists = _.isNil(parent) && _.isString(content.parent)
    const parentIsTrashedButStillExists = _.isObject(parent) && parent.trashed
    if (parentNoLongerExists || parentIsTrashedButStillExists) {
      // Parent is trashed or doesn't exist.
      restoreData.parent = null
    } 

    if (parentIsTrashedButStillExists) {
      // The parent is still around, even though we're restoring a child of it.
      // Let's remove the to-be-restored child from the parent's children.
      const parentRef = this.getCollection('contents').doc(parent.id)
      const newParentChildren = _.without(parent.children, content.id)
      batch.update(parentRef, {
        children: newParentChildren,
        updated: now
      })
    }

    const contentRef = this.getCollection('contents').doc(content.id)
    batch.update(contentRef, restoreData)

    return batch.commit()
  }

  delete (items) {
    if (_.isEmpty(items)) { return new Promise(resolve => {
        resolve()
      })
    }

    const batch = this.db.batch()

    _.forEach(items, item => {
      if (item.operation === 'DELETE') {
        const contentRef = this.getCollection('contents').doc(item.id)
        batch.delete(contentRef)
  
        if (item.type === 'Document') {
          const documentRef = this.getCollection('documents').doc(item.key)
          batch.delete(documentRef)
        }
      } else if (item.operation === "UPDATE") {
        const contentRef = this.getCollection('contents').doc(item.id)
        batch.update(contentRef, item.data)
      }
    })

    return batch.commit()
  }
}

export default FirebaseBackend
