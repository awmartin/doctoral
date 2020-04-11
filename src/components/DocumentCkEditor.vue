<template>
  <div class="editor">
    <div :class="menuClass">
      <div class="right">
        <move-dropdown :content="content" />

        <span class="saving-icon">
          <progress-alert-icon v-if="isSaving" />
        </span>

        <div class="warning-message" v-if="showWarning">{{ warningMessage }}</div>
      </div>

      <div class="left">
        <button @click="trashDocument">
          <delete-outline-icon />
        </button>
      </div>
    </div>

    <div class="document-editor-sidebar">
      <document-heading :heading="titleHeading" :click="navigateToHeading(null)" />
      <document-heading :heading="heading" v-for="heading in headings" :key="heading.i" :click="navigateToHeading(heading)" />
    </div>

    <div class="scrollable">
      <div class="document-editor">
        <input ref="title"
          type="text"
          class="doc-title"
          placeholder="Title…"
          v-model="title"
          v-if="contentDocumentPair"
          @input="onChange" />

        <ckeditor ref="editor"
          :editor="editor"
          :config="editorConfig"
          :value="documentContent"
          @input="onChange"
          v-if="contentDocumentPair"
          :disabled="disabled"
        ></ckeditor>
      </div>

      <div class="document-spacer" @click="focusEditorAtEnd"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.editor {
  position: relative;
  height: 100%;
}
.scrollable {
  height: calc(100% - 52px);
  overflow-x: hidden;
  overflow-y: scroll;
}
.menu {
  height: 32px;
  padding: 10px;
  left: calc(18%);
  width: calc(100% - 20px);

  display: flex;
  justify-content: space-between;
  align-items: center;

  &.warning {
    background-color: lighten(lightcoral, 7%);
  }
  .warning-message {
    margin-left: 5px;
    color: white;
    font-weight: 500;
  }

  .right {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }
  .left {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  button {
    margin-right: 5px;
  }
  .saving-icon {
    margin-left: 5px;
  }
}
.document-editor {
  max-width: 750px;
  margin: 0 auto;
}
.document-editor-sidebar {
  position: absolute;
  left: 10px;
  top: 130px;
  bottom: 0;
  width: 15%;
}
.document-spacer {
  height: 100%;
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
import ProgressAlertIcon from 'vue-material-design-icons/ProgressAlert'
import MoveDropdown from '@/components/MoveDropdown'

import { mapState } from 'vuex'

import DocumentHeading from '@/components/DocumentHeading'
import util from '@/lib/util'

const fb = require('../firebase.js')
const _ = require('lodash')

export default {
  name: 'DocumentEditor',

  props: ['contentDocumentPair'],

  created () {
    // In case the user edits the title, which triggers saving, before focusing the editor.
    // Populate this field here so saving doesn't wipe out content.
    this.documentContent = this.document.content
  },

  mounted () {
    // Desired behavior is to focus the title bar, but to do so, we need a signal to introduce it.
    if (_.startsWith(this.$route.path, '/new')) {
      this.$router.replace({ name: 'Document', params: { id: this.$route.params.id } })
      this.$refs.title.focus()
      this.$refs.title.select()
    }
  },

  components: {
    DeleteOutlineIcon,
    ProgressAlertIcon,
    DocumentHeading,
    MoveDropdown
  },

  data () {
    return {
      documentContent: '',
      editor: BalloonEditor,
      editorConfig: {
        placeholder: 'Content here…',
        link: {
          addTargetToExternalLinks: false,
          // decorators: {
          //   isExternal: {
          //     mode: 'manual',
          //     callback: url => /^(https?:)?\/\//.test( url ),
          //     label: 'isExternal',
          //     attributes: {
          //       target: '_top',
          //       rel: 'noopener noreferrer'
          //     }
          //   },
          //   addTargetToExternalLinks: {
          //     mode: 'manual',
          //     callback: url => /^(https?:)?\/\//.test( url ),
          //     label: 'isExternal',
          //     attributes: {
          //       target: '_top',
          //       rel: 'noopener noreferrer'
          //     }
          //   }
          // } // decorators
        }
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

    document () {
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
          this.document.title = newValue
        }
      }
    },

    headings () {
      return this.headingsByContent
    },

    headingsByContent () {
      const tr = []

      const removeDecorations = text => {
        let tr = text
        tr = _.replace(tr, /<i>/g, '')
        tr = _.replace(tr, /<\/i>/g, '')
        tr = _.replace(tr, /<b>/g, '')
        tr = _.replace(tr, /<\/b>/g, '')
        tr = _.replace(tr, /<strong>/g, '')
        tr = _.replace(tr, /<\/strong>/g, '')
        tr = _.replace(tr, /<em>/g, '')
        tr = _.replace(tr, /<\/em>/g, '')
        return tr
      }

      const getHeadings = heading => {
        let i = 0
        while (i > -1) {
          i = this.documentContent.indexOf(`<${heading}>`, i)
          if (i === -1) { break }
          const j = this.documentContent.indexOf(`</${heading}>`, i + 4)
          const text = removeDecorations(this.documentContent.substring(i + 4, j))
          tr.push({ i, j, text, level: heading })
          i = j + 5
        }
      }

      getHeadings('h2')
      getHeadings('h3')
      getHeadings('h4')
      getHeadings('h5')
      getHeadings('h6')

      tr.sort((a, b) => a.i > b.i ? 1 : -1)

      return tr
    },

    titleHeading () {
      return {
        text: this.title,
        level: 'h1'
      }
    },

    isSaving () {
      return !_.isNil(this.timer)
    },

    isTrashed () {
      return this.content.trashed
    },

    isInTrashedAncestorFolder () {
      // If this content isn't trashed and in the home folder, we're ok.
      const contentInHomeFolder = _.isNil(this.content.parent)
      if (contentInHomeFolder) { return false }

      // Look up the ancestor tree to see if one of the containing folders is trashed.
      let parent = this.content

      while (_.isObject(parent)) {
        const inHomeFolder = _.isNil(parent.parent)
        if (inHomeFolder) {
          return null
        }
        // Expecting parent.parent to be a string.
        parent = this.getContent(parent.parent)
      }

      // When the loop breaks, the home folder wasn't reached, thus one
      // of the parents wasn't available in 'contents', which includes
      // all un-trashed docs.
      return true
    },

    menuClass () {
      let tr = 'menu'
      if (this.showWarning) {
        tr += ' warning'
      }
      return tr
    },

    warningMessage () {
      if (this.isTrashed) {
        return 'This document is in the Trash. Restore to edit.'
      } else if (this.isInTrashedAncestorFolder) {
        return `This document is in a folder in the Trash. Move it or restore the folder to edit.`
      }
      return ''
    },

    showWarning () {
      return this.isTrashed || this.isInTrashedAncestorFolder
    },

    disabled () {
      return this.isTrashed || this.isInTrashedAncestorFolder
    }
  },

  methods: {
    onChange (content) {
      // Arguments: content, event, editor

      // Update the document's content. Do this manually so Firebase doesn't overwrite
      // the editor's content with the lazy saving.
      if (_.isString(content)) {
        this.documentContent = content
      }

      if (!_.isNil(this.timer)) {
        clearTimeout(this.timer)
      }

      const saver = this.saveDocument()
      this.timer = setTimeout(saver, 3000)
    },

    cancelPendingSave () {
      if (!_.isNil(this.timer)) {
        clearTimeout(this.timer)
      }
      this.timer = null
    },

    saveDocument () {
      const documentData = {
        title: _.trim(this.title),
        content: this.documentContent,
        contentId: this.content.id,
        documentId: this.document.id,
        contentKey: this.content.key,
        updated: new Date()
      }

      const _this = this

      return () => {
        _this.cancelPendingSave()

        const { title, content, contentId, documentId, contentKey, updated } = documentData

        const batch = fb.db.batch()
        const documentRef = fb.getCollection('documents').doc(documentId)
        batch.update(documentRef, { title, content, updated })

        const contentRef = fb.getCollection('contents').doc(contentId)
        batch.update(contentRef, { title, updated })

        return batch.commit().then(() => {
          console.debug('Saved document!', title)

          // Update the URL if the title has changed.
          const routeId = _.head(_.split(this.$route.params.id, '-'))
          const stillLookingAtTheSameDoc = routeId === contentKey && routeId === documentId
          if (stillLookingAtTheSameDoc) {
            const urlId = util.getDocUrlId({
              title,
              id: documentId
            })

            if (this.$route.path !== `/doc/${urlId}`) {
              this.$router.replace({ name: 'Document', params: { id: urlId }})
            }
          }
        }) // end batch.commit
      } // end closure
    },

    trashDocument () {
      const documentTitle = this.title
      const contentRef = fb.getCollection('contents').doc(this.content.id)
      const contentData = {
        trashed: true,
        updated: new Date()
      }
      contentRef.update(contentData).then(() => {
        console.debug('Trashed document', documentTitle)
        this.$router.push({ name: 'Dashboard' })
      })
    },

    getHeadingInDOM (headingObj) {
      if (_.isNil(headingObj)) {
        return {
          offsetTop: 40
        }
      }

      const headings = this.$el.querySelectorAll(headingObj.level)
      const found = _.find(headings, heading => heading.innerText === headingObj.text)
      if (!_.isNil(found)) {
        return found
      } else {
        return {
          offsetTop: 40
        }
      }
    },

    navigateToHeading (headingObj) {
      return () => {
        const elt = this.getHeadingInDOM(headingObj)
        const scrollable = this.$el.querySelector('.scrollable')

        scrollable.scrollTo({
          left: 0, 
          top: elt.offsetTop - 90,
          behavior: 'smooth'
        })
      }
    },

    getContent (id) {
      return _.find(this.contents, content => content.id === id)
    },

    focusEditor () {
      const editor = this.$refs.editor

      // This works but it also scrolls the container. WTF?
      editor.instance.sourceElement.focus({
        preventScroll: true
      })
    },

    focusEditorAtEnd () {
      const editor = this.$refs.editor

      // This works but it also scrolls the container. WTF?
      editor.instance.sourceElement.focus({
        preventScroll: true
      })

      const model = editor.instance.model
      const root = model.document.getRoot()

      model.change(writer => {
        const position = writer.createPositionAt(root, root.maxOffset)
        writer.setSelection(position)
      })
    }
  } // methods
}
</script>
