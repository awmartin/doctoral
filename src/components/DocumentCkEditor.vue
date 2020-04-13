<template>
  <div class="editor">
    <div :class="menuClass">
      <div class="left">
        <move-dropdown :content="content" />

        <div class="warning-message" v-if="showWarning">{{ warningMessage }}</div>

        <breadcrumb :content="content" />
      </div>

      <div class="right">
        <span class="publishing" v-if="isPublishing">
          <span class="message">Publishing…</span>
          <progress-alert-icon class="icon" />
        </span>

        <span class="saving" v-if="isSaving">
          <span class="message">Saving…</span>
          <progress-alert-icon class="icon" />
        </span>

        <button @click="publishDocument" class="publish-document" :disabled="isPublishing || isSaving">
          <publish-icon />
        </button>

        <double-press-button @click="trashDocument" class="trash-document">
          <delete-outline-icon />
        </double-press-button>
      </div>
    </div>

    <div class="document-editor-sidebar">
      <headings-outline :document="document" :scrollableElement="scrollableElement" />

      <div class="stats">
        <div class="last-saved">Last saved: {{ lastSaved }}</div>
        <div class="words">Words: {{ editorStats.words }}</div>
        <div class="characters">Characters: {{ editorStats.characters }}</div>
      </div>
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
          @ready="onReady"
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

  .left {
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }
  .right {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  button {
    margin-right: 5px;
  }
  .saving, .publishing {
    margin-right: 10px;
    color: gray;
  }
  .message {
    font-style: italic;
    font-size: 0.8rem;
  }
  button.trash-document {
    margin-left: 10px;
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

  .headings-outline {
    overflow-y: scroll;
    height: calc(100% - 90px);
  }

  .stats {
    position: absolute;
    bottom: 10px;
    left: 0px;
    font-style: italic;
    font-size: 0.8rem;
    color: #aaa;
  }
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
import BalloonEditor from '@ckeditor/ckeditor5-editor-balloon/src/ballooneditor'

import EssentialsPlugin from '@ckeditor/ckeditor5-essentials/src/essentials'
import BoldPlugin from '@ckeditor/ckeditor5-basic-styles/src/bold'
import ItalicPlugin from '@ckeditor/ckeditor5-basic-styles/src/italic'
import UnderlinePlugin from '@ckeditor/ckeditor5-basic-styles/src/underline'
import StrikethroughPlugin from '@ckeditor/ckeditor5-basic-styles/src/strikethrough'
import SuperscriptPlugin from '@ckeditor/ckeditor5-basic-styles/src/superscript'
import SubscriptPlugin from '@ckeditor/ckeditor5-basic-styles/src/subscript'
import CodePlugin from '@ckeditor/ckeditor5-basic-styles/src/code'
import Alignment from '@ckeditor/ckeditor5-alignment/src/alignment'
import BlockQuote from '@ckeditor/ckeditor5-block-quote/src/blockquote'
import RemoveFormat from '@ckeditor/ckeditor5-remove-format/src/removeformat'

import LinkPlugin from '@ckeditor/ckeditor5-link/src/link'
import ParagraphPlugin from '@ckeditor/ckeditor5-paragraph/src/paragraph'
import HeadingPlugin from '@ckeditor/ckeditor5-heading/src/heading'
import List from '@ckeditor/ckeditor5-list/src/list'
import TodoList from '@ckeditor/ckeditor5-list/src/todolist'
import HighlightPlugin from '@ckeditor/ckeditor5-highlight/src/highlight'
import Indent from '@ckeditor/ckeditor5-indent/src/indent'
import IndentBlock from '@ckeditor/ckeditor5-indent/src/indentblock'

import Image from '@ckeditor/ckeditor5-image/src/image'
import ImageToolbar from '@ckeditor/ckeditor5-image/src/imagetoolbar'
// import ImageCaption from '@ckeditor/ckeditor5-image/src/imagecaption'
import ImageStyle from '@ckeditor/ckeditor5-image/src/imagestyle'
import ImageResize from '@ckeditor/ckeditor5-image/src/imageresize'
import MediaEmbed from '@ckeditor/ckeditor5-media-embed/src/mediaembed'
import HorizontalLine from '@ckeditor/ckeditor5-horizontal-line/src/horizontalline'
import Table from '@ckeditor/ckeditor5-table/src/table';
import TableToolbar from '@ckeditor/ckeditor5-table/src/tabletoolbar';

import PasteFromOffice from '@ckeditor/ckeditor5-paste-from-office/src/pastefromoffice'
import Autoformat from '@ckeditor/ckeditor5-autoformat/src/autoformat'
import WordCount from '@ckeditor/ckeditor5-word-count/src/wordcount'

import DeleteOutlineIcon from 'vue-material-design-icons/DeleteOutline'
import ProgressAlertIcon from 'vue-material-design-icons/ProgressAlert'
import PublishIcon from 'vue-material-design-icons/Publish'

import MoveDropdown from '@/components/MoveDropdown'
import Breadcrumb from '@/components/Breadcrumb'
import HeadingsOutline from '@/components/HeadingsOutline'
import DoublePressButton from '@/components/DoublePressButton'
import util from '@/lib/util'

import { DateTime } from 'luxon'
import { mapState } from 'vuex'
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

    this.scrollableElement = this.$el.querySelector('.scrollable')
  },

  components: {
    DeleteOutlineIcon,
    ProgressAlertIcon,
    PublishIcon,
    HeadingsOutline,
    MoveDropdown,
    Breadcrumb,
    DoublePressButton
  },

  data () {
    return {
      documentContent: '',
      scrollableElement: null,
      editorStats: { words: 0, characters: 0},
      editor: BalloonEditor,
      editorConfig: {
        placeholder: 'Content here…',

        plugins: [
          EssentialsPlugin,
          PasteFromOffice,
          Autoformat,
          WordCount,

          // Formatting
          BoldPlugin,
          ItalicPlugin,
          UnderlinePlugin,
          StrikethroughPlugin,
          SuperscriptPlugin,
          SubscriptPlugin,
          CodePlugin,
          LinkPlugin,
          ParagraphPlugin,
          HeadingPlugin,
          HighlightPlugin,
          BlockQuote,
          RemoveFormat,
          Alignment,

          // Content
          List,
          TodoList,
          Indent,
          IndentBlock,
          Image,
          ImageToolbar,
          // ImageCaption,
          ImageStyle,
          ImageResize,
          MediaEmbed,
          HorizontalLine,
          Table,
          TableToolbar
        ],

        toolbar: {
          items: [
            'heading',
            '|',
            'bold',
            'italic',
            'highlight',
            'link',
            '|',
            'bulletedList',
            'numberedList',
            'todoList',
            'mediaEmbed',
            '|',
            'alignment',
            'indent',
            'outdent',
            '|',
            'undo',
            'redo',
            '|',
            'horizontalLine',
            'insertTable',
            'blockQuote',
            '|',
            'underline',
            'strikethrough',
            'superscript',
            'subscript',
            'code',
            'removeFormat',
          ]
        },

        image: {
          toolbar: [ 'imageTextAlternative', '|', 'imageStyle:full', 'imageStyle:alignLeft', 'imageStyle:alignCenter', 'imageStyle:alignRight' ],
          styles: ['full', 'alignLeft', 'alignCenter', 'alignRight']
        },

        table: {
          contentToolbar: [ 'tableColumn', 'tableRow', 'mergeTableCells' ]
        },

        wordCount: {
          onUpdate: stats => {
            this.editorStats = stats
          }
        },

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
      timer: null,
      isPublishing: false
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
    },

    lastSaved () {
      const dt = DateTime.fromJSDate(this.document.updated.toDate())
      const date = dt.toFormat('yyyy MMM dd')
      const time = _.toLower(dt.toFormat('h:mm a'))
      return `${date} at ${time}`
    }
  },

  methods: {
    onReady (editor) {
      editor.keystrokes.set('Ctrl+S', (data, cancel) => {
        _.noop(data) // Because the linter complains.
        this.queueSave()
        cancel()
      })
    },

    onChange (content) {
      // Arguments: content, event, editor

      // Update the document's content. Do this manually so Firebase doesn't overwrite
      // the editor's content with the lazy saving.
      if (_.isString(content)) {
        this.documentContent = content
      }

      this.queueSave()
    },

    cancelPendingSave () {
      if (!_.isNil(this.timer)) {
        clearTimeout(this.timer)
      }
      this.timer = null
    },

    queueSave () {
      this.cancelPendingSave()

      const saver = this.saveDocument()
      this.timer = setTimeout(saver, 3000)
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
    },

    publishDocument () {
      const publish = fb.functions.httpsCallable('publishDocument')
      const slug = _.toLower(util.getTitleUrl(this.content))
      const args = {
        documentId: this.document.id,
        slug
      }

      this.isPublishing = true

      publish(args).then(result => {
        console.debug(result)
      }).catch(error => {
        console.error('An error occurred while publishing:', error)
      }).finally(() => {
        this.isPublishing = false
      })
    }
  } // methods
}
</script>
