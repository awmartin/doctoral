<template>
  <div class="editor">
    <div class="menu">
      <button @click="deleteDocument">
        <delete-forever-outline-icon />
      </button>
    </div>
    <div class="document-editor">
      <input type="text" class="doc-title" placeholder="Title…" v-model="title" />

      <editor
        autofocus
        ref="editor"
        holder-id="codex-editor"
        :init-data="initialData"
        @save="onSave"
        @ready="onReady"
        @change="onChange"
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
#vue-editor-js {
  margin-left: -50px;
}
input.doc-title {
  width: 650px;

  font-size: 2.0rem;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  font-weight: 500;

  margin-top: 50px;
  border: none;
  outline: none;
  padding: 10px 0 10px 23px;
  color: #2c3e50;
}
</style>

<script>
import { Editor } from 'vue-editor-js'
import DeleteForeverOutlineIcon from 'vue-material-design-icons/DeleteForeverOutline'
import { mapState } from 'vuex'

const fb = require('../firebase.js')
const _ = require('lodash')

export default {
  name: 'DocumentEditor',

  props: ['document'],

  components: {
    Editor,
    DeleteForeverOutlineIcon
  },

  beforeMount () {
    this.initialData = this.document.content
  },

  beforeDestroy () {
    this.saveDocument()
  },

  data () {
    return {
      initialData: null,
      timer: null
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
          this.document.title = _.trim(newValue)
        }
      }
    },

    content: {
      get () {
        if (_.isNil(this.document)) { return {} }
        if (_.isObject(this.document) && _.isNil(this.document.content)) { return {} }
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

    onReady () {
      _.noop()
    },

    saveDocument () {
      this.$refs.editor.save()
    },

    cancelPendingSave () {
      if (!_.isNil(this.timer)) {
        clearTimeout(this.timer)
        this.timer = null
      }
    },

    onSave (content) {
      this.document.content = content

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
