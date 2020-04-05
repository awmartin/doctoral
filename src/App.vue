<template>
  <div id="app">
    <div id="nav">
      <router-link to="/">Dashboard</router-link>
      <router-link to="/about">About</router-link>
      <router-link to="/login">Log in</router-link>
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

  a {
    font-size: 12px;
    letter-spacing: 1px;
    padding: 10px;
    color: #2c3e50;
    text-transform: uppercase;
    font-weight: 600;

    &.router-link-exact-active {
      background-color: #eee;
    }
  }
}
</style>
