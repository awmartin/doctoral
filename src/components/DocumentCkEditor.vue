<template>
  <div class="editor">
    <div class="menu">
      <button @click="trashDocument">
        <delete-outline-icon />
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
import DeleteOutlineIcon from 'vue-material-design-icons/DeleteOutline'
import { mapState } from 'vuex'

const fb = require('../firebase.js')
const _ = require('lodash')

export default {
  name: 'DocumentEditor',

  props: ['contentDocumentPair'],

  components: {
    DeleteOutlineIcon
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
    ...mapState(['currentUser', 'sidebarTarget', 'contents']),

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

    trashDocument () {
      const documentId = this.document.id
      const contentRef = fb.getCollection('contents').doc(this.content.id)
      contentRef.update({ trashed: true }).then(() => {
        console.debug('Trashed document', documentId)
        this.$router.push({ name: 'Dashboard' })
      })
    },

    deleteDocument () {
      const batch = fb.db.batch()

      // Remove the document's content id from the children field of the containing folder.
      if (!_.isNil(this.content.parent)) {
        const parentContent = _.find(this.contents, item => item.id === this.content.parent)
        if (!_.isNil(parentContent)) {
          const parentRef = fb.getCollection('contents').doc(this.content.parent)
          _.pull(parentContent.children, this.content.id)
          batch.update(parentRef, { children: parentContent.children })
        }
      }

      // Delete the content object.
      const contentRef = fb.getCollection('contents').doc(this.content.id)
      batch.delete(contentRef)

      // Delete the document itself.
      const documentId = this.document.id
      const documentRef = fb.getCollection('documents').doc(documentId)
      batch.delete(documentRef)

      batch.commit().then(() => {
        console.debug('Deleted document', documentId)
        this.cancelPendingSave()
        this.$router.push({ name: 'Dashboard' })
      })
    }
  }
}
</script>
