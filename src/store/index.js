import Vue from 'vue'
import Vuex from 'vuex'

const fb = require('../firebase.js')
const _ = require('lodash')

Vue.use(Vuex)

fb.auth.onAuthStateChanged(user => {
  if (user) {
    store.dispatch('bootstrapUserData', user)
  } else {
    store.commit('setBootstrapState', 'not-logged-in')
  }
})

const store = new Vuex.Store({
  state: {
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
    savingTimer: null
  },

  getters: {
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

    getContent (state) {
      return contentId => _.find(state.contents, content => content.id === contentId)
    },

    getContentByDocumentKey (state) {
      return documentKey => _.find(state.contents, content => content.key === documentKey)
    },

    isSaving (state) {
      return !_.isNil(state.savingTimer)
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
    bootstrapUserData (context, user) {
      context.commit('setCurrentUser', user)

      const contentsRef = fb.getCollection('contents')
      const contentsListener = contentsRef.where('trashed', '==', false).onSnapshot(snapshot => {
        const contents = []
        snapshot.forEach(doc => {
          contents.push({ ...doc.data(), id: doc.id })
        })
        context.commit('setContents', contents)
      })

      context.commit('setContentsListener', contentsListener)
      context.commit('setBootstrapState', 'logged-in')

      const userRef = fb.db.collection('data').doc(user.uid)
      const userListener = userRef.onSnapshot(snapshot => {
        const userData = snapshot.data()

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
      })

      context.commit('setUserListener', userListener)
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

    startSavingTimer (context, callback) {
      const savingTimer = setTimeout(callback, 3000)
      context.commit('setSavingTimer', savingTimer)
    },

    cancelSavingTimer (context) {
      if (!_.isNil(context.state.savingTimer)) {
        clearTimeout(context.state.savingTimer)
      }
      context.commit('setSavingTimer', null)
    }
  },

  mutations: {
    setCurrentUser (state, val) {
      state.currentUser = val
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

      const uid = state.currentUser.uid
      const userRef = fb.db.collection('data').doc(uid)
      userRef.update({ sortDirection: 'ascending' })
    },

    setSortDirectionDescending (state) {
      state.sortDirection = 'descending'

      const uid = state.currentUser.uid
      const userRef = fb.db.collection('data').doc(uid)
      userRef.update({ sortDirection: 'descending' })
    },

    setSortGroupingFolders (state) {
      state.sortGrouping = 'folders'

      const uid = state.currentUser.uid
      const userRef = fb.db.collection('data').doc(uid)
      userRef.update({ sortGrouping: 'folders' })
    },

    setSortGroupingNone (state) {
      state.sortGrouping = 'none'

      const uid = state.currentUser.uid
      const userRef = fb.db.collection('data').doc(uid)
      userRef.update({ sortGrouping: 'none' })
    },

    setSortByTitle (state) {
      state.sortField = 'title'

      const uid = state.currentUser.uid
      const userRef = fb.db.collection('data').doc(uid)
      userRef.update({ sortField: 'title' })
    },

    setSortByLastUpdated (state) {
      state.sortField = 'updated'

      const uid = state.currentUser.uid
      const userRef = fb.db.collection('data').doc(uid)
      userRef.update({ sortField: 'updated' })
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

    setSavingTimer (state, val) {
      state.savingTimer = val
    }
  }
})

export default store
