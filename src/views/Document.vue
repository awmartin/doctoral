<template>
  <div class="home">
    <div class="sidebar">
      <DocumentList></DocumentList>
    </div>

    <DocumentEditor :document="document" :key="document.id" class="editor"></DocumentEditor>
  </div>
</template>

<style lang="scss" scoped>
.home {
  display: flex;
  height: calc(100% - 36px);
}
.sidebar {
  width: 20%;
  height: 100%;
  border-right: 1px solid #eee;
}
.editor {
  width: 80%;
}
</style>

<script>
import DocumentCkEditor from '@/components/DocumentCkEditor'
// import DocumentEditorJs from '@/components/DocumentEditorJs'
// import DocumentQuillEditor from '@/components/DocumentQuillEditor'
import DocumentList from '@/components/DocumentList'
import { mapState } from 'vuex'

const _ = require('lodash')
const DocumentEditor = DocumentCkEditor

export default {
  name: 'Home',

  components: {
    DocumentList,
    DocumentEditor
  },

  computed: {
    ...mapState(['documents']),

    document () {
      return _.find(this.documents, doc => doc.id === this.routeId)
    },

    routeId () {
      const elts = _.split(this.$route.params.id, '-')
      return _.head(elts)
    }
  }
}
</script>
