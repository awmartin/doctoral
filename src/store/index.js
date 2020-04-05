import Vue from 'vue'
import Vuex from 'vuex'

const fb = require('../firebase.js')
const _ = require('lodash')

Vue.use(Vuex)

fb.auth.onAuthStateChanged(user => {
  if (user) {
    store.dispatch('bootstrapUserData', user)
  }
})

const store = new Vuex.Store({
  state: {
    currentUser: null,
    contentsListener: null,
    contents: [],
    sidebarTarget: null
  },

  getters: {
    isLoggedIn (state) {
      return _.isObject(state.currentUser)
    },

    userEmail (state) {
      return state.currentUser.email
    }
  },

  actions: {
    bootstrapUserData (context, user) {
      context.commit('setCurrentUser', user)

      const contentsRef = fb.db.collection('data').doc(user.uid).collection('contents')
      const contentsListener = contentsRef.onSnapshot(snapshot => {
        const contents = []
        snapshot.forEach(doc => {
          contents.push({ ...doc.data(), id: doc.id })
        })
        context.commit('setContents', contents)
      })

      context.commit('setContentsListener', contentsListener)
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

    // Navigate directly to a path.
    // folderPath is an array of content objects or null
    setTargetFolder (state, folderPath) {
      state.sidebarTarget = folderPath
    },

    pushTargetFolder (state, folderContent) {
      if (_.isNil(state.sidebarTarget)) {
        state.sidebarTarget = [folderContent.id]
      } else {
        state.sidebarTarget.push(folderContent.id)
      }
    },

    popTargetFolder (state) {
      if (_.isArray(state.sidebarTarget)) {
        if (_.size(state.sidebarTarget) === 1) {
          state.sidebarTarget = null
        } else {
          state.sidebarTarget.pop()
        }
      }
    }
  }
})

export default store
