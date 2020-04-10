<template>
  <div class="dashboard" v-if="isLoggedIn">
    <div class="sidebar">
      <ContentList></ContentList>
    </div>

    <div class="content">
      <trash v-if="isTrash" />
    </div>
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
</style>

<script>
import ContentList from '@/components/ContentList'
import Trash from '@/components/Trash'

import { mapGetters } from 'vuex'

export default {
  name: 'Dashboard',

  components: {
    ContentList,
    Trash
  },

  computed: {
    ...mapGetters(['isLoggedIn']),

    isTrash () {
      return this.$route.name === 'Trash'
    }
  }
}
</script>
