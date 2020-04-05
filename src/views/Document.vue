<template>
  <div class="document">
    <div class="sidebar">
      <ContentList></ContentList>
    </div>

    <DocumentEditor :contentDocumentPair="contentDocumentPair" :key="document.id" class="editor" v-if="contentDocumentPair" ref="editor"></DocumentEditor>
  </div>
</template>

<style lang="scss" scoped>
.document {
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
import ContentList from '@/components/ContentList'
import { mapState } from 'vuex'

const fb = require('../firebase')
const _ = require('lodash')
const DocumentEditor = DocumentCkEditor

export default {
  name: 'Home',

  components: {
    ContentList,
    DocumentEditor
  },

  created () {
    this.loadNewDocument()
  },

  beforeDestroy () {
    this.unsubscribe()
  },

  data () {
    return {
      document: null,
      documentUnsubscriber: null,
      documentEditorData_: null
    }
  },

  watch: {
    content () {
      if (!_.isNil(this.$refs.editor) && _.isFunction(this.$refs.editor.saveDocument)) {
        this.$refs.editor.saveDocument().then(() => {
          this.loadNewDocument()
        })
      } else {
        this.loadNewDocument()
      }
    }
  },

  computed: {
    ...mapState(['contents']),

    content () {
      return _.find(this.contents, content => content.key === this.routeId)
    },

    routeId () {
      const elts = _.split(this.$route.params.id, '-')
      return _.head(elts)
    },

    contentDocumentPair () {
      if (_.isNil(this.document) || _.isNil(this.content)) { return null }
      if (this.content.key !== this.document.id) { return null }
      return {
        content: this.content,
        document: this.document
      }
    }
  },

  methods: {
    loadNewDocument () {
      this.unsubscribe()

      if (_.isObject(this.content)) {
        const key = this.content.key
        const documentRef = fb.getCollection('documents').doc(key)
        this.documentUnsubscriber = documentRef.onSnapshot(doc => {
          this.document = doc.data()
          this.document.id = doc.id
        })
      }
    },

    unsubscribe () {
      if (_.isFunction(this.documentUnsubscriber)) {
        this.documentUnsubscriber()
      }
    }
  }
}
</script>
