const _ = require('lodash')

class Adapter {
  constructor (config) {
    this.config = config || _.stubObject()
    this.onLoggedIn = null
    this.user = null
  }

  registerAuthCallback (onLoggedIn, onNotLoggedIn) {
    throw new Error('Implement Adapter.registerAuthCallback')
  }

  authenticate () {
    throw new Error('Implement Adapter.authenticate')
  }

  deauthenticate () {
    throw new Error('Implement Adapter.deauthenticate')
  }

  getCurrentUser () {
    return this.user
  }

  get isLoggedIn () {
    return !_.isNil(this.user)
  }

  updateUser (data) {
    throw new Error('Implement Adapter.updateUser')
  }

  registerContentsListener (onUpdate) {
    throw new Error('Implement Adapter.registerContentsListener')
  }

  registerTrashListener (onUpdate) {
    throw new Error('Implement Adapter.registerTrashListener')
  }

  registerArchiveListener (onUpdate) {
    throw new Error('Implement Adapter.registerArchiveListener')
  }

  registerUserStateListener (onUpdate) {
    throw new Error('Implement Adapter.registerUserStateListener')
  }

  // Some backends require an ID to be provisioned first before creating.
  provisionNewContentReference () {
    throw new Error('Implement Adapter.provisionNewContentReference')
  }

  // Some backends require an ID to be provisioned first before creating.
  provisionNewDocumentReference () {
    throw new Error('Implement Adapter.profisionNewDocumentReference')
  }

  createContent (content, parent, batch_ = null) {
    throw new Error('Implement Adapter.createContent')
  }

  updateContent (content, batch_ = null) {
    throw new Error('Implement Adapter.updateContent')
  }

  createDocument (document, parent) {
    throw new Error('Implement Adapter.createDocument')
  }

  updateDocument (document) {
    throw new Error('Implement Adapter.updateDocument')
  }

  loadDocument (documentKey) {
    throw new Error('Implement Adapter.loadDocument')
  }

  publishDocument (document, slug) {
    // Optional.
  }

  delete (items) {
    throw new Error('Implement Adapter.delete')
  }

  loadTagSnippets (hashtag) {
    throw new Error('Implement Adapter.loadTagSnippets')
  }

  updateTagSnippets (content, batch_ = null) {
    throw new Error('Implement Adapter.updateTagSnippets')
  }

  uploadFileForDocument (file, document) {
    throw new Error('Implement Adapter.uploadFileForDocument')
  }
}

export default Adapter