import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

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

    getContent (state) {
      return contentId => {
        if (_.isNil(contentId)) { return null }
        return _.find(state.contents, content => content.id === contentId)
      }
    },

    getContentByDocumentKey (state) {
      return documentKey => _.find(state.contents, content => content.key === documentKey)
    },

    homeChildren (state) {
      return _.filter(state.contents, content => _.isNil(content.parent))
    },

    starredContents (state) {
      return _.filter(state.contents, content => content.starred)
    },

    getFolderContents (state, getters) {
      return folder => {
        if (_.isNil(folder) || (_.isObject(folder) && _.isNil(folder.id))) {
          return getters.homeChildren
        } else if (_.isObject(folder) && _.isString(folder.id)) {
          return _.filter(state.contents, content => content.parent === folder.id)
        } else {
          return []
        }
      }
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
      
        while (_.isObject(parent)) {
          const inHomeFolder = _.isNil(parent.parent)
          if (inHomeFolder) {
            return false
          }
          // Expecting parent.parent to be a string.
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

    registerTrashListener (context, { onSuccess = _.noop, onError = _.noop }) {
      const onUpdate = items => {
        context.trashedItems = items
      }
      const listener = context.state.backend.registerTrashListener(onUpdate, onError)
      onSuccess(listener)
    },

    createDocument (context, { folder, starred, onSuccess = _.noop, onError = _.noop }) {
      context.state.backend.createDocument(folder, starred).then(onSuccess).catch(onError)
    },

    updateDocument (context, { content, document, data, onSuccess = _.noop, onError = _.noop }) {
      if (_.isNil(content) || _.isNil(document) || _.isNil(data)) {
        onError('Attempted to update a document, but the data provided had a null value.')
        return
      }
      if (!util.isContentForDocument(content)) {
        onError('Attempted to update a document, but the associated content provided was not properly formatted.')
        return
      }
      if (!util.isDocument(document)) {
        onError('Attempted to update a document, but the document provided was not properly formatted.')
        return
      }
      context.state.backend.updateDocument(content, document, data).then(onSuccess).catch(onError)
    },

    publishDocument (context, { document, onSuccess = _.noop, onError = _.noop }) {
      if (!util.isDocument(document)) {
        onError('Attempted to publish a document, but did\'t get a document to publish:', document)
        return
      }
      context.state.backend.publishDocument(document).then(onSuccess).catch(onError)
    },

    loadDocument (context, { documentKey, onSuccess, onError = _.noop }) {
      context.state.backend.loadDocument(documentKey).then(onSuccess).catch(onError)
    },

    toggleStar (context, { content, onSuccess = _.noop, onError = _.noop }) {
      context.state.backend.toggleStar(content).then(onSuccess).catch(onError)
    },

    moveContent (context, { contentToMove, destination, onSuccess = _.noop, onError = _.noop }) {
      const parentContent = context.getters.getContent(contentToMove.parent)
      context.state.backend.moveContent(contentToMove, parentContent, destination).then(onSuccess).catch(onError)
    },

    trashDocument (context, { document, onSuccess = _.noop, onError = _.noop }) {
      if (_.isNil(document) || (_.isObject(document) && !_.isString(document.id))) {
        onError('Provided document was null.')
        return
      }
      if (document.type !== 'Document') {
        onError('Asked to send a document to the trash, but did\'t get a document.')
        return
      }
      context.state.backend.trashDocument(document).then(onSuccess).catch(onError)
    },
    
    createFolder (context, { folder, starred, onSuccess = _.noop, onError = _.noop }) {
      context.state.backend.createFolder(folder, starred).then(onSuccess).catch(onError)
    },

    updateFolder (context, { folder, data, onSuccess = _.noop, onError = _.noop }) {
      context.dispatch('cancelSavingFolderTimer')
      context.state.backend.updateFolder(folder, data).then(onSuccess).catch(onError)
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
      context.state.backend.trashFolder(folder).then(onSuccess).catch(onError)
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
    setCurrentUser (state, val) {
      state.currentUser = val
    },

    setBackend (state, backend) {
      state.backend = backend
    },

    setContents (state, val) {
      state.contents = val
    },

    setContentsListener (state, val) {
      state.contentsListener = val
    },

    setUserListener (state, func) {
      state.userListener = func
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

    setSavingFolderTime (state, timer) {
      state.savingFolderTimer = timer
    }
  }
})


export default store
