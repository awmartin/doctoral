<template>
  <div class="login">
    <button @click="loginGoogle">Log in with Google</button>
  </div>
</template>

<style lang="scss" scoped>
button {
  font-weight: normal;
  font-size: 1.0rem;
  padding: 10px;
}
</style>

<script>
const fb = require('../firebase.js')

export default {
  methods: {
    loginGoogle () {
      fb.auth.signInWithRedirect(fb.googleAuthProvider)
    },

    logout () {
      fb.auth.signOut().then(() => {
        this.$router.push('/logout')
      }).catch(error => {
        console.error('Error in signing the user out:', error)
        this.$store.dispatch('clearProfile')
        this.$router.push('/logout')
      })
    }
  }
}
</script>