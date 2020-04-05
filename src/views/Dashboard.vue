<template>
  <div class="home">
    <DocumentList></DocumentList>
  </div>
</template>

<style lang="scss" scoped>

</style>

<script>
import DocumentList from '@/components/DocumentList'

export default {
  name: 'Dashboard',

  components: {
    DocumentList
  }
}
</script>
