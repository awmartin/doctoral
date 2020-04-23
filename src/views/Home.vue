<template>
  <div class="home">
    <loading />
  </div>
</template>

<style lang="scss" scoped>
.home {
  width: 100%;
  height: 100%;
  position: relative;
  .loading {
    left: calc(50% - 25px);
    top: calc(50% - 25px);
  }
}
</style>

<script>
import Loading from '@/components/Loading'
import { mapGetters } from 'vuex'
const fb = require('../firebase.js')

export default {
  name: 'Home',

  components: {
    Loading
  },

  computed: {
    ...mapGetters(['isLoggedIn', 'isReadyNotLoggedIn']),

    userIsRequestingLoginPage () {
      return this.$route.name === 'Login'
    }
  },

  mounted () {
    if (this.isReadyNotLoggedIn && this.userIsRequestingLoginPage) {
      this.loginGoogle()
    } else if (this.isReadyNotLoggedIn && !this.userIsRequestingLoginPage) {
      this.redirectToHome()
    } else if (this.isLoggedIn) {
      this.$router.push({ name: 'Dashboard' })
    }
  },

  watch: {
    isReadyNotLoggedIn (newVal) {
      if (this.userIsRequestingLoginPage && newVal) {
        // Directly navigating to #/login should go to the auth process.
        this.loginGoogle()
      } else {
        // Otherwise redirect to the website front page.
        this.redirectToHome()
      }
    },

    isLoggedIn (newVal) {
      const requestingLoginWhileAlreadyLoggedIn = this.userIsRequestingLoginPage && newVal
      if (requestingLoginWhileAlreadyLoggedIn) {
        // Redirect to the Dashboard if we're already logged in.
        this.$router.push({ name: 'Dashboard' })
      }
    }
  },

  methods: {
    loginGoogle () {
      fb.auth.signInWithRedirect(fb.googleAuthProvider)
    },

    redirectToHome () {
      window.location.href = '/'
    }
  }
}
</script>
