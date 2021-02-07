<template>
  <div id="app">
    <div id="nav">
      <div class="left">
        <a href="/">Home</a>
        <router-link to="/dashboard" v-if="isLoggedIn" :class="navigationClass('Dashboard')">Dashboard</router-link>
      </div>

      <div class="right">
        <router-link to="/archive" v-if="isLoggedIn" :class="navigationClass('Archive')">Archive</router-link>
        <router-link to="/trash" v-if="isLoggedIn" :class="navigationClass('Trash')">Trash</router-link>
        <a @click="logout" href="#" v-if="isLoggedIn">Log out</a>
        <a @click="login" href="#" v-else>Log in</a>
      </div>
    </div>

    <router-view/>
  </div>
</template>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  height: 100%;
}

#nav {
  height: 35px;
  padding: 0 10px;
  border-bottom: 1px solid #eee;

  display: flex;
  align-items: center;
  justify-content: space-between;

  a {
    font-size: 12px;
    letter-spacing: 1px;
    padding: 10px;
    color: #2c3e50;
    text-transform: uppercase;
    font-weight: 600;

    &.router-link-exact-active,
    &.selected {
      background-color: lighten(lightskyblue, 10%);
    }
    &:hover {
      background-color: lightskyblue;
    }
    &:active {
      background-color: darken(lightskyblue, 10%);
    }
  }
}
.left {
  display: flex;
  align-items: center;
}
.right {
  display: flex;
  align-items: center;
}
</style>

<script>
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters(['isLoggedIn'])
  },

  methods: {
    logout () {
      const onSuccess = () => {
        window.location.href = '/'
      }

      const onError = error => {
        console.error('Error when signing out:', error)
        window.location.href = '/'
      }

      this.$store.dispatch('logout', { onSuccess, onError })
    },

    login () {
      this.$store.dispatch('login', { provider: this.$route.query.provider || 'google' })
    },

    navigationClass (name) {
      if (this.$route.name === name || (this.$route.name === 'Document' && name === 'Dashboard')) {
        return 'nav selected'
      } else {
        return 'nav'
      }
    }
  }
}
</script>
