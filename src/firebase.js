import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import 'firebase/analytics'

import firebaseConfig from './firebaseConfig.js'
firebase.initializeApp(firebaseConfig)

const db = firebase.firestore()
const auth = firebase.auth()

const googleAuthProvider = new firebase.auth.GoogleAuthProvider()
const getCurrentUser = () => {
  return auth.currentUser
}
const getCollection = key => {
  return db.collection('data').doc(auth.currentUser.uid).collection(key)
}

export {
  db,
  auth,
  getCurrentUser,
  googleAuthProvider,
  getCollection
}
