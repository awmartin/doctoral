<template>
  <div class="editor">
    <div class="menu">
      <button @click="deleteDocument">
        <delete-forever-outline-icon />
      </button>
    </div>
    <div class="document-editor">
      <input type="text" class="doc-title" placeholder="Title…" v-model="title" v-if="contentDocumentPair" />
      <ckeditor :editor="editor" :config="editorConfig" v-model="documentContent" @input="onChange" v-if="contentDocumentPair"></ckeditor>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.editor {
  position: relative;
  height: 100%;

  display: flex;
  justify-content: center;

  overflow-x: hidden;
  overflow-y: scroll;
}
.menu {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;

  display: flex;
  justify-content: flex-end;
}
.document-editor {
  flex-grow: 2;
  max-width: 750px;
}
input.doc-title {
  width: 100%;

  font-size: 2.0rem;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  font-weight: 500;

  margin-top: 50px;
  border: none;
  outline: none;
  padding: 10px;
  color: #2c3e50;
}
</style>

<script>
import BalloonEditor from '@ckeditor/ckeditor5-build-balloon'
import DeleteForeverOutlineIcon from 'vue-material-design-icons/DeleteForeverOutline'
import { mapState } from 'vuex'

const fb = require('../firebase.js')
const _ = require('lodash')

export default {
  name: 'DocumentEditor',

  props: ['contentDocumentPair'],

  components: {
    DeleteForeverOutlineIcon
  },

  data () {
    return {
      editor: BalloonEditor,
      editorConfig: {
        placeholder: 'Content here…'
      },
      timer: null
    }
  },

  computed: {
    ...mapState(['currentUser', 'sidebarTarget']),

    content () {
      if (_.isNil(this.contentDocumentPair)) { return null }
      return this.contentDocumentPair.content
    },

    document() {
      if (_.isNil(this.contentDocumentPair)) { return null }
      return this.contentDocumentPair.document
    },

    title: {
      get () {
        if (_.isNil(this.document)) { return '' }
        return this.document.title
      },
      set (newValue) {
        if (!_.isNil(this.document)) {
          const newTitle = _.trim(newValue)
          this.document.title = newTitle
        }
      }
    },

    documentContent: {
      get () {
        if (_.isNil(this.document)) { return '' }
        return this.document.content
      },
      set (newValue) {
        if (!_.isNil(this.document)) {
          this.document.content = newValue
        }
      }
    }
  },

  methods: {
    onChange () {
      if (_.isNil(this.timer)) {
        this.timer = setTimeout(this.saveDocument, 3000)
      } else {
        clearTimeout(this.timer)
        this.timer = setTimeout(this.saveDocument, 3000)
      }
    },

    cancelPendingSave () {
      if (!_.isNil(this.timer)) {
        clearTimeout(this.timer)
        this.timer = null
      }
    },

    saveDocument () {
      this.cancelPendingSave()

      const documentData = {
        title: this.title,
        content: this.documentContent,
        contentId: this.content.id,
        documentId: this.document.id
      }

      const { title, content, contentId, documentId } = documentData

      console.debug('Saving…', _.clone(documentData))

      const batch = fb.db.batch()
      const documentRef = fb.getCollection('documents').doc(documentId)
      batch.update(documentRef, { title, content })

      const contentRef = fb.getCollection('contents').doc(contentId)
      batch.update(contentRef, { title })

      return batch.commit().then(() => {
        console.debug('Saved document!', documentId, contentId)
      })
    },

    deleteDocument () {
      const batch = fb.db.batch()

      const contentPath = 'contents/' + _.join(this.sidebarTarget, '/contents/')
      const contentRef = fb.getCollection(contentPath).doc(this.contentId)
      batch.delete(contentRef)

      const documentId = this.document.id
      const documentRef = fb.getCollection('documents').doc(documentId)
      batch.delete(documentRef)

      batch.commit().then(() => {
        console.debug('Deleted document', documentId)
        this.cancelPendingSave()
        this.$router.push({ name: 'Home' })
      })
    }
  }
}
</script>
