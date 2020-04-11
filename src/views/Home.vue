<template>
  <div class="login">
    <h1>Doctoral</h1>
    <button @click="loginGoogle" v-if="!isLoggedIn">Log in with Google</button>
  </div>
</template>

<style lang="scss" scoped>
.login {
  padding: 10px;
}
button {
  font-weight: normal;
  font-size: 1.0rem;
  padding: 10px;

  border: 2px solid lightskyblue;
  background-color: transparent;
}
</style>

<script>
import { mapGetters } from 'vuex'
const fb = require('../firebase.js')

export default {
  name: 'Home',

  computed: {
    ...mapGetters(['isLoggedIn'])
  },

  methods: {
    loginGoogle () {
      fb.auth.signInWithRedirect(fb.googleAuthProvider)
    }
  }
}
</script>