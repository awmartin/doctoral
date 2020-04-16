<template>
  <div class="dashboard" v-if="isLoggedIn">
    <div class="sidebar">
      <ContentList></ContentList>
    </div>

    <div class="content">
      <trash v-if="isTrash" />
    </div>
  </div>

  <div class="loading-wrapper" v-else>
    <loading />
  </div>
</template>

<style lang="scss" scoped>
.dashboard {
  display: flex;
  height: calc(100% - 36px);
}
.sidebar {
  width: 18%;
  height: 100%;
  border-right: 1px solid #eee;
}
.content {
  min-height: 1px;
  width: 82%;
}
.loading-wrapper {
  height: calc(100% - 36px);
  .loading {
    top: calc(50% - 25px);
    left: calc(50% - 25px);
  }
}
</style>

<script>
import ContentList from '@/components/ContentList'
import Trash from '@/components/Trash'
import Loading from '@/components/Loading'

import { mapGetters } from 'vuex'

const fb = require('../firebase.js')

export default {
  name: 'Dashboard',

  components: {
    ContentList,
    Trash,
    Loading
  },

  mounted () {
    if (this.isReadyNotLoggedIn) {
      fb.auth.signInWithRedirect(fb.googleAuthProvider)
    }
  },

  watch: {
    isReadyNotLoggedIn (newVal) {
      if (newVal) {
        fb.auth.signInWithRedirect(fb.googleAuthProvider)
      }
    }
  },

  computed: {
    ...mapGetters(['isLoggedIn', 'isReadyNotLoggedIn']),

    isTrash () {
      return this.$route.name === 'Trash'
    }
  }
}
</script>
