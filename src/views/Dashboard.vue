<template>
  <div class="dashboard" v-if="isLoggedIn">
    <div class="sidebar">
      <ContentList></ContentList>
    </div>

    <div class="content">
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
import { mapGetters } from 'vuex'

export default {
  name: 'Dashboard',

  components: {
    ContentList
  },

  computed: {
    ...mapGetters(['isLoggedIn'])
  }
}
</script>
