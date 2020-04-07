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
    contents: [],
    sidebarTarget: null,
    appBootstrapState: 'unknown'
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

      const contentsRef = fb.db.collection('data').doc(user.uid).collection('contents')
      const contentsListener = contentsRef.where('trashed', '==', false).onSnapshot(snapshot => {
        const contents = []
        snapshot.forEach(doc => {
          contents.push({ ...doc.data(), id: doc.id })
        })
        context.commit('setContents', contents)
      })

      context.commit('setContentsListener', contentsListener)
      context.commit('setBootstrapState', 'logged-in')
    },

    clearProfile (context) {
      context.commit('setCurrentUser', null)
    },

    unsubscribeFromListeners (context) {
      if (!_.isNil(context.state.contentsListener) && _.isFunction(context.state.contentsListener)) {
        context.state.contentsListener()
        context.commit('setContentsListener', null)
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

    setTargetFolder (state, folderKey) {
      state.sidebarTarget = folderKey
    },

    setBootstrapState (state, val) {
      state.appBootstrapState = val
    }
  }
})

export default store
