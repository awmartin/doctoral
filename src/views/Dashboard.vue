<template>
  <div class="dashboard" v-if="isLoggedIn">
    <Sidebar />

    <div class="content">
      &nbsp;
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
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'

import { mapGetters } from 'vuex'

export default {
  name: 'Dashboard',

  components: {
    Sidebar,
    Loading
  },

  watch: {
    isReadyNotLoggedIn (newVal, oldVal) {
      if (newVal && !oldVal) {
        this.$router.push({ name: 'Login' })
      }
    }
  },

  computed: {
    ...mapGetters(['isLoggedIn', 'isReadyNotLoggedIn'])
  }
}
</script>
