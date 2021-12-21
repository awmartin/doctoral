<template>
  <main id="app">
    <Navigation />
    <router-view />
  </main>
</template>

<style lang="scss">
main#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  height: 100%;
}
</style>

<script>
import Navigation from '@/components/Navigation'

export default {
  components: {
    Navigation
  }
}
</script>
