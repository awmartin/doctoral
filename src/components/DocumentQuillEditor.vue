<template>
  <div class="editor">
    <div class="menu">
      <button @click="deleteDocument">
        <delete-forever-outline-icon />
      </button>
    </div>

    <div class="document-editor">
      <input type="text" class="doc-title" placeholder="Title…" v-model="title" />

      <quill-editor
        ref="editor"
        v-model="body"
        :options="editorOptions"
        @change="onChange($event)"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.editor {
  position: relative;
  height: 100%;

  display: flex;
  justify-content: center;

  overflow-y: scroll;
}
.menu {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;

  flex-grow: 2;
  display: flex;
  justify-content: flex-end;
}
.document-editor {
  flex-grow: 2;
  max-width: 750px;
}
input.doc-title {
  max-width: 750px;

  font-size: 2.0rem;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  font-weight: 500;

  margin-top: 50px;
  border: none;
  outline: none;
  padding: 12px 15px; // Derived from the QuillEditor
  color: #2c3e50;
}
.ql-editor {
  font-family: Avenir, Helvetica, Arial, sans-serif;
}
</style>

<script>
import { DeleteForeverOutline as DeleteForeverOutlineIcon } from 'mdue'
import { mapState } from 'vuex'

const fb = require('../firebase.js')
const _ = require('lodash')

export default {
  name: 'DocumentEditor',

  props: ['document'],

  components: {
    DeleteForeverOutlineIcon
  },

  beforeUnmount () {
    this.saveDocument()
  },

  data () {
    return {
      timer: null,
      editorOptions: {
        theme: 'bubble'
      }
    }
  },

  computed: {
    ...mapState(['currentUser']),

    title: {
      get () {
        if (_.isNil(this.document)) { return '' }
        return this.document.title
      },
      set (newValue) {
        if (!_.isNil(this.document)) {
          const newTitle = _.trim(newValue)
          this.document.setTitle(newTitle)
        }
      }
    },

    body: {
      get () {
        if (_.isNil(this.document)) { return {} }
        if (_.isObject(this.document) && _.isNil(this.document.body)) { return {} }
        return this.document.body
      },
      set (newValue) {
        if (!_.isNil(this.document)) {
          this.document.setBody(newValue)
        }
      }
    }
  },

  methods: {
    onChange ({ html }) {
      this.content = html

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
      const document = fb.db.collection('data').doc(this.currentUser.uid).collection('documents').doc(this.document.id)
      document.update({
        title: this.title,
        content: this.content
      }).then(() => {
        console.debug('Saved document!', this.document.id)
        this.cancelPendingSave()
      })
    },

    deleteDocument () {
      this.cancelPendingSave()
      const documentId = this.document.id
      const document = fb.db.collection('data').doc(this.currentUser.uid).collection('documents').doc(this.document.id)
      document.delete().then(() => {
        console.debug('Deleted document', documentId)
        this.$router.push({ name: 'Home' })
      })
    }
  }
}
</script>
