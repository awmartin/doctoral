import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

import Document from '@/models/Document'
import Content from '@/models/Content'
import util from '@/lib/util'

const _ = require('lodash')

const store = new Vuex.Store({
  state: {
    backend: null,
    editor: null,

    currentUser: null,
    username: null,
    userListener: null,

    contentsListener: null,
    contents: [],
    trashListener: null,
    trashedItems: [],
    sidebarTarget: null,
    appBootstrapState: 'unknown',

    sortDirection: 'descending',
    sortGrouping: 'none',
    sortField: 'title',
    filterTag: 'all',

    manualOverrideShowSidebar: false,
    savingDocumentTimer: null,
    savingFolderTimer: null
  },

  getters: {
    // ------------------------------ AUTH STATE ------------------------------

    isLoggedIn (state) {
      return _.isObject(state.currentUser) && state.appBootstrapState === 'logged-in'
    },

    isReady (state) {
      return state.appBootstrapState === 'logged-in' || state.appBootstrapState === 'not-logged-in'
    },

    isReadyNotLoggedIn (state) {
      return state.appBootstrapState === 'not-logged-in'
    },

    isPending (state) {
      return state.appBootstrapState === 'unknown'
    },

    userEmail (state) {
      return state.currentUser.email
    },

    // ------------------------------ CONTENT MANAGEMENT ------------------------------

    getContent (state, getters) {
      return contentId => {
        if (_.isNil(contentId)) { return null }
        return _.find(getters.untrashedContents, content => content.id === contentId)
      }
    },

    getContentByDocumentKey (state) {
      return documentKey => _.find(state.contents, content => content.key === documentKey)
    },

    getTrashed (state, getters) {
      return contentId => {
        if (_.isNil(contentId)) { return null }
        return _.find(getters.trashedContents, content => content.id === contentId)
      }
    },

    homeChildren (state, getters) {
      return _.filter(getters.untrashedContents, content => _.isEmpty(content.parent))
    },

    starredContents (state, getters) {
      return _.filter(getters.untrashedContents, content => content.starred)
    },

    trashedContents (state) {
      const trashedFromContent = _.filter(state.contents, content => content.trashed)
      return _.isEmpty(state.trashedItems) ? trashedFromContent : state.trashedItems
    },

    untrashedContents (state) {
      return _.filter(state.contents, content => !content.trashed)
    },

    getFolderContents (state, getters) {
      return folder => {
        if (Content.isHomeFolder(folder)) {
          return getters.homeChildren
        } else if (folder.isStarredFolder()) {
          return getters.starredContents
        } else if (folder.isFolder()) {
          return _.filter(getters.untrashedContents, content => content.parent === folder.id)
        } else {
          return []
        }
      }
    },

    getChildFolders (state, getters) {
      return folder => _.filter(getters.getFolderContents(folder), content => content.isFolder())
    },

    // ------------------------------ CONTENT STATE ------------------------------

    isSavingDocument (state) {
      return !_.isNil(state.savingDocumentTimer)
    },

    isSavingFolder (state) {
      return !_.isNil(state.savingFolderTime)
    },

    isInTrashedAncestorFolder (state, getters) {
      return content => {
        if (_.isNil(content)) { return false }
      
        // If this content isn't trashed and in the home folder, we're ok.
        const contentInHomeFolder = _.isNil(content.parent)
        if (contentInHomeFolder) { return false }
      
        // Look up the ancestor tree to see if one of the containing folders is trashed.
        let parent = content
      
        while (!Content.isHomeFolder(parent)) {
          const inHomeFolder = _.isEmpty(parent.parent)
          if (inHomeFolder) {
            return false
          }

          parent = getters.getContent(parent.parent)
        }
      
        // When the loop breaks, the home folder wasn't reached, thus one
        // of the parents wasn't available in 'contents', which includes
        // all un-trashed docs.
        return true
      }
    }
  },

  actions: {
    registerBackend(context, backend) {
      context.commit('setBackend', backend)

      function gotUser (user) {
        context.dispatch('bootstrapUserData', user)
      }

      function noUser () {
        context.commit('setBootstrapState', 'not-logged-in')
      }
      
      backend.registerAuthCallback(gotUser, noUser)
    },

    login (context) {
      context.state.backend.authorize()
    },

    logout (context, { onSuccess = _.noop, onError = _.noop} ) {
      this.$store.dispatch('clearProfile')
      this.$store.dispatch('unsubscribeFromListeners')
      context.state.backend.deauthorize().then(onSuccess).catch(onError)
    },

    bootstrapUserData (context, user) {
      console.log('Bootstrapping with user data:', user)

      const onContentsUpdate = contents => {
        context.commit('setContents', contents)
      }
      const contentsListener = context.state.backend.registerContentsListener(onContentsUpdate)

      const onUserStateUpdate = userData => {
        if (_.has(userData, 'username')) {
          context.commit('setUsername', userData.username)
        }

        if (_.has(userData, 'sortDirection')) {
          context.state.sortDirection = userData.sortDirection
        }

        if (_.has(userData, 'sortField')) {
          context.state.sortField = userData.sortField
        }

        if (_.has(userData, 'sortGrouping')) {
          context.state.sortGrouping = userData.sortGrouping
        }
      }
      const userListener = context.state.backend.registerUserStateListener(onUserStateUpdate)

      context.commit('setCurrentUser', user)
      context.commit('setContentsListener', contentsListener)
      context.commit('setBootstrapState', 'logged-in')
      context.commit('setUserListener', userListener)
    },

    registerTrashListener (context) {
      const onUpdate = items => {
        context.commit('setTrashedItems', items)
      }
      const listener = context.state.backend.registerTrashListener(onUpdate)
      context.commit('setTrashListener', listener)
    },

    deregisterTrashListener (context) {
      if (_.isFunction(context.state.trashListener)) {
        context.state.trashListener()
        context.commit('setTrashedItems', [])
        context.commit('setTrashListener', null)
      }
    },

    createDocument (context, { parent, onSuccess = _.noop, onError = _.noop }) {
      const document = Document.new()

      context.state.backend.provisionNewContentReference()
      .then(newContentRef => {
        document.content.setId(newContentRef.id)
        return context.state.backend.provisionNewDocumentReference()
      })
      .then(newDocumentRef => {
        document.setId(newDocumentRef.id)

        let parentFolder = null
        // Customize the table-of-contents object for the current state.
        if (Content.isContentForFolder(parent) && parent.isStarredFolder()) {
          // If the user is looking at the starred items, create this document as starred.
          // And create it in the Home folder.
          document.star()
        } else if (Content.isContentForFolder(parent) && !parent.isHomeFolder()) {
          // Create the unstarred document in the folder that's open, if not starred.
          parent.addChild(document.content)
          parentFolder = parent
        }

        return context.state.backend.createDocument(document, parentFolder)
      })
      .then(onSuccess)
      .catch(onError)
    },

    updateDocument (context, { document, onSuccess = _.noop, onError = _.noop }) {
      if (_.isNil(document)) {
        onError('Attempted to update a document, but the data provided was null.')
        return
      }
      if (!Content.isContentForDocument(document.content)) {
        onError('Attempted to update a document, but the associated content was null or improperly formatted.')
        return
      }
      if (!Document.isDocument(document)) {
        onError('Attempted to update a document, but the document provided was improperly formatted.')
        return
      }

      context.state.backend.updateDocument(document).then(onSuccess).catch(onError)
    },

    publishDocument (context, { document, onSuccess = _.noop, onError = _.noop }) {
      if (!Document.isDocument(document)) {
        onError('Attempted to publish a document, but did\'t get a document to publish:', document)
        return
      }
      const slug = _.toLower(util.getTitleUrl(document.title))
      context.state.backend.publishDocument(document, slug).then(onSuccess).catch(onError)
    },

    loadDocument (context, { documentKey, onSuccess, onError = _.noop }) {
      const onLoadSuccess = document => {
        if (Document.isDocument(document)) {
          const content = context.getters.getContentByDocumentKey(document.id)

          if (Content.isContentForDocument(content)) {
            document.setTableOfContentsReference(content)
            return document
          } else {
            throw new Error('Could not find the associated content object.')
          }
        }

        throw new Error('Loaded document was not correctly formed.')
      }

      context.state.backend.loadDocument(documentKey).then(onLoadSuccess).then(onSuccess).catch(onError)
    },

    toggleStar (context, { content, onSuccess = _.noop, onError = _.noop }) {
      content.toggleStar()
      context.state.backend.updateContent(content).then(onSuccess).catch(onError)
    },

    moveContent (context, { contentToMove, destination, onSuccess = _.noop, onError = _.noop }) {
      // Returns null for home folder.
      const parent = context.getters.getContent(contentToMove.parent)

      if (Content.isContentForFolder(parent)) {
        parent.removeChild(contentToMove)
      }

      if (Content.isContentForFolder(destination)) {
        destination.addChild(contentToMove)
      } else {
        contentToMove.setParent(null)
      }

      context.state.backend.updateContent([contentToMove, parent, destination]).then(onSuccess).catch(onError)
    },

    trashDocument (context, { document, onSuccess = _.noop, onError = _.noop }) {
      if (_.isNil(document) || (_.isObject(document) && !_.isString(document.id))) {
        onError('Provided document was null.')
        return
      }
      if (!Document.isDocument(document)) {
        onError('Asked to send a document to the trash, but did\'t get a document.')
        return
      }

      document.trash()

      context.state.backend.updateContent(document.content).then(onSuccess).catch(onError)
    },

    createFolder (context, { parent, onSuccess = _.noop, onError = _.noop }) {
      const folder = Content.newFolder()

      let parentFolder = null
      context.state.backend.provisionNewContentReference()
      .then(newFolderRef => {
        folder.setId(newFolderRef.id)
        
        if (Content.isContentForFolder(parent) && parent.isStarredFolder()) {
          folder.star()
        } else if (Content.isContentForFolder(parent) && !Content.isHomeFolder(parent)) {
          parent.addChild(folder)
          parentFolder = parent
        }

        return context.state.backend.createContent(folder, parentFolder)
      })
      .then(onSuccess)
      .catch(onError)
    },

    updateFolder (context, { folder, onSuccess = _.noop, onError = _.noop }) {
      context.dispatch('cancelSavingFolderTimer')
      context.state.backend.updateContent(folder).then(onSuccess).catch(onError)
    },

    trashFolder (context, { folder, onSuccess = _.noop, onError = _.noop }) {
      if (_.isNil(folder) || (_.isObject(folder) && !_.isString(folder.id))) {
        onError('Provided folder was null.')
        return
      }
      if (folder.type !== 'Folder') {
        onError('Asked to send a folder to the trash, but did\'t get a folder.')
        return
      }

      folder.trash()

      context.state.backend.updateContent(folder).then(onSuccess).catch(onError)
    },

    restore (context, { content, onSuccess = _.noop, onError = _.noop }) {
      if (!Content.isContent(content)) {
        onError('Error while restoring something from the trash. Provided object wasn\'t a Content object.')
        return
      }

      content.restore()

      const parent = context.getters.getContent(content.parent) || context.getters.getTrashed(content.parent)

      if (Content.isContent(parent) && parent.trashed) {
        parent.removeChild(content)
      } else if (_.isNil(parent)) {
        content.setParent(null)
      }

      context.state.backend.updateContent([content, parent]).then(onSuccess).catch(onError)
    },

    delete (context, { content, onSuccess = _.noop, onError = _.noop }) {
      console.log('Queueing for deletion:', content.title)

      // Start the process of defining what to delete recursively.

      let allItemsToDelete = []

      const deleteDocument_ = content_ => {
        console.log(`  Queueing ${content_.type} ${content_.title} for deletion.`)

        const item = {
          operation: 'DELETE',
          content: content_
        }

        allItemsToDelete.push(item)
      }

      const deleteDocument = content_ => {
        // Remove the document's content id from the children field of the containing folder.
        if (_.isString(content_.parent)) {
          const parentContent = context.getters.getContent(content_.parent) || context.getters.getTrashed(content_.parent)

          if (!_.isNil(parentContent)) {
            parentContent.removeChild(content_)

            const item = {
              operation: 'UPDATE',
              content: parentContent
            }

            allItemsToDelete.push(item)
          }
        }

        deleteDocument_(content_)
      }

      const deleteFolder_ = content_ => {
        console.log(`  Queueing ${content_.type} ${content_.title} for deletion.`)

        const item = {
          operation: 'DELETE',
          content: content_
        }

        allItemsToDelete.push(item)

        // Delete the children, recursively.
        _.forEach(content_.children, childId => {
          const child = context.getters.getContent(childId) || context.getters.getTrashed(childId)

          if (_.isObject(child)) {
            if (child.isDocument()) {
              deleteDocument_(child)
            } else if (child.isFolder()) {
              deleteFolder_(child)
            }
          }
        })
      }

      const deleteFolder = content_ => {
        // Remove the folders's content id from the 'children' field of the containing folder.
        if (!_.isNil(content_.parent)) {
          const parentContent = context.getters.getContent(content_.parent) || context.getters.getTrashed(content_.parent)

          if (!_.isNil(parentContent)) {
            parentContent.removeChild(content_)

            const item = {
              operation: 'UPDATE',
              content: parentContent
            }

            allItemsToDelete.push(item)
          }
        }

        deleteFolder_(content_)
      }

      if (content.isDocument()) {
        deleteDocument(content)
      } else if (content.isFolder()) {
        deleteFolder(content)
      }

      context.state.backend.delete(allItemsToDelete).then(onSuccess).catch(onError)
    },

    clearProfile (context) {
      context.commit('setCurrentUser', null)
      context.commit('setUsername', null)
    },

    unsubscribeFromListeners (context) {
      if (_.isFunction(context.state.contentsListener)) {
        context.state.contentsListener()
        context.commit('setContentsListener', null)
      }

      if (_.isFunction(context.state.userListener)) {
        context.state.userListener()
        context.commit('setUserListener', null)
      }
    },

    registerEditor (context, editor) {
      context.commit('setEditorObject', editor)
    },

    deregisterEditor (context) {
      context.commit('setEditorObject', null)
    },

    focusEditor (context) {
      if (_.isObject(context.state.editor)) {
        context.state.editor.sourceElement.focus()
      }
    },

    showSidebar (context) {
      context.commit('setSidebarManualOverride', true)
    },

    hideSidebar (context) {
      context.commit('setSidebarManualOverride', false)
    },

    startSavingDocumentTimer (context, callback) {
      const timer = setTimeout(callback, 3000)
      context.commit('setSavingDocumentTimer', timer)
    },

    cancelSavingDocumentTimer (context) {
      if (!_.isNil(context.state.savingDocumentTimer)) {
        clearTimeout(context.state.savingDocumentTimer)
      }
      context.commit('setSavingDocumentTimer', null)
    },

    startSavingFolderTimer (context, callback) {
      const timer = setTimeout(callback, 1000)
      context.commit('setSavingFolderTimer', timer)
    },

    cancelSavingFolderTimer (context) {
      if (!_.isNil(context.state.savingFolderTimer)) {
        clearTimeout(context.state.savingFolderTimer)
      }
      context.commit('setSavingFolderTimer', null)
    }
  },

  mutations: {
    setBackend (state, backend) {
      state.backend = backend
    },

    setCurrentUser (state, val) {
      state.currentUser = val
    },

    setUserListener (state, func) {
      state.userListener = func
    },

    setContents (state, val) {
      state.contents = val
    },

    setContentsListener (state, val) {
      state.contentsListener = val
    },

    setTrashedItems (state, items) {
      state.trashedItems = items
    },

    setTrashListener (state, func) {
      state.trashListener = func
    },

    setUsername (state, username) {
      state.username = username
    },

    setTargetFolder (state, folderKey) {
      state.sidebarTarget = folderKey
      state.filterTag = 'all'
    },

    setBootstrapState (state, val) {
      state.appBootstrapState = val
    },

    setSortDirectionAscending (state) {
      state.sortDirection = 'ascending'
      state.backend.updateUser({ sortDirection: 'ascending' })
    },

    setSortDirectionDescending (state) {
      state.sortDirection = 'descending'
      state.backend.updateUser({ sortDirection: 'descending' })
    },

    setSortGroupingFolders (state) {
      state.sortGrouping = 'folders'
      state.backend.updateUser({ sortGrouping: 'folders' })
    },

    setSortGroupingNone (state) {
      state.sortGrouping = 'none'
      state.backend.updateUser({ sortGrouping: 'none' })
    },

    setSortByTitle (state) {
      state.sortField = 'title'
      state.backend.updateUser({ sortField: 'title' })
    },

    setSortByLastUpdated (state) {
      state.sortField = 'updated'
      state.backend.updateUser({ sortField: 'updated' })
    },

    setFilterTag (state, filterTag) {
      state.filterTag = filterTag
    },

    setEditorObject (state, editor) {
      Vue.set(state, 'editor', editor)
    },

    setSidebarManualOverride (state, val) {
      state.manualOverrideShowSidebar = val
    },

    setSavingDocumentTimer (state, timer) {
      state.savingDocumentTimer = timer
    },

    setSavingFolderTimer (state, timer) {
      state.savingFolderTimer = timer
    }
  }
})


export default store
