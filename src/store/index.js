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
    currentUser: null,
    contentsListener: null,
    userListener: null,
    contents: [],
    sidebarTarget: null,
    appBootstrapState: 'unknown',

    sortDirection: 'descending',
    sortGrouping: 'none',
    sortField: 'title',

    username: null
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
    }
  }
})

export default store
