<template>
  <div class="folder">
    <div class="sidebar">
      <ContentList></ContentList>
    </div>

    <div class="contents"></div>
  </div>
</template>

<style lang="scss" scoped>
.folder {
  display: flex;
  height: calc(100% - 36px);
}
.sidebar {
  width: 20%;
  height: 100%;
  border-right: 1px solid #eee;
}
.contents {
  width: 80%;
}
</style>

<script>
import ContentList from '@/components/ContentList'

export default {
  name: 'Folder',

  components: {
    ContentList
  }
}
</script>
