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
    ...mapGetters(['isLoggedIn', 'isReadyNotLoggedIn'])
  },

  mounted () {
    if (this.isReadyNotLoggedIn) {
      this.redirectToHome()
    }
  },

  watch: {
    isReadyNotLoggedIn (newVal) {
      if (this.$route.name === 'Login' && newVal) {
        // Directly navigating to #/login should go to the auth process.
        fb.auth.signInWithRedirect(fb.googleAuthProvider)
      } else {
        // Otherwise redirect to the website front page.
        this.redirectToHome()
      }
    },

    isLoggedIn (newVal) {
      if (this.$route.name == 'Login' && newVal) {
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