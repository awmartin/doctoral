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
    documents: []
  },

  getters: {
    isLoggedIn (state) {
      return _.isObject(state.currentUser) && _.isObject(state.accessProfile)
    },

    userEmail (state) {
      return state.currentUser.email
    }
  },

  actions: {
    bootstrapUserData (context, user) {
      context.commit('setCurrentUser', user)

      const documents = fb.db.collection('data').doc(user.uid).collection('documents')
      documents.onSnapshot(snapshot => {
        const documents = []
        snapshot.forEach(doc => {
          documents.push({ ...doc.data(), id: doc.id })
        })
        context.commit('setDocuments', documents)
      })
    },

    clearProfile (context) {
      context.commit('setCurrentUser', null)
    }
  },

  mutations: {
    setCurrentUser (state, val) {
      state.currentUser = val
    },

    setDocuments (state, val) {
      state.documents = val
    }
  }
})

export default store
