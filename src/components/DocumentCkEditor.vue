<template>
  <div class="editor">
    <div class="menu">
      <progress-alert-icon v-if="isSaving" />
      <button @click="trashDocument">
        <delete-outline-icon />
      </button>
    </div>

    <div class="document-editor-sidebar">
      <document-heading :heading="titleHeading" :click="navigateToHeading(null)"></document-heading>
      <document-heading :heading="heading" v-for="heading in headings" :key="heading.i" :click="navigateToHeading(heading)"></document-heading>
    </div>

    <div class="document-editor">
      <input type="text" class="doc-title" placeholder="Title…" v-model="title" v-if="contentDocumentPair" @input="onChange" />
      <ckeditor ref="editor" :editor="editor" :config="editorConfig" v-model="documentContent" @input="onChange" v-if="contentDocumentPair"></ckeditor>
    </div>

    <div class="document-spacer"></div>
  </div>
</template>

<style lang="scss" scoped>
.editor {
  position: relative;
  height: 100%;

  overflow-x: hidden;
  overflow-y: scroll;
}
.menu {
  position: fixed;
  top: 46px;
  left: 15%;
  width: calc(85% - 10px);

  display: flex;
  justify-content: flex-end;
  align-items: center;

  >.material-design-icon {
    margin-right: 5px;
  }
}
.document-editor {
  max-width: 750px;
  margin: 0 auto;
}
.document-editor-sidebar {
  position: fixed;
  left: calc(18% + 10px);
  top: 115px;
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
import { mapState } from 'vuex'

import DocumentHeading from '@/components/DocumentHeading'

const fb = require('../firebase.js')
const _ = require('lodash')

export default {
  name: 'DocumentEditor',

  props: ['contentDocumentPair'],

  components: {
    DeleteOutlineIcon,
    ProgressAlertIcon,
    DocumentHeading
  },

  data () {
    return {
      status: null,
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
    },

    headings () {
      return this.headingsByContent
    },

    headingsByContent () {
      const tr = []

      const getHeadings = heading => {
        let i = 0
        while (i > -1) {
          i = this.documentContent.indexOf(`<${heading}>`, i)
          if (i === -1) { break }
          const j = this.documentContent.indexOf(`</${heading}>`, i + 4)
          const text = this.documentContent.substring(i + 4, j)
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

        this.$el.scrollTo({
          left: 0, 
          top: elt.offsetTop - 40,
          behavior: 'smooth'
        })
      }
    }
  } // methods
}
</script>
