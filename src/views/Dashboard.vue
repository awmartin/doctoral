<template>
  <div class="dashboard" v-if="isLoggedIn">
    <Sidebar />

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
import Trash from '@/components/Trash'
import Loading from '@/components/Loading'

import { mapGetters } from 'vuex'

export default {
  name: 'Dashboard',

  components: {
    Sidebar,
    Trash,
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
    ...mapGetters(['isLoggedIn', 'isReadyNotLoggedIn']),

    isTrash () {
      return this.$route.name === 'Trash'
    }
  }
}
</script>
