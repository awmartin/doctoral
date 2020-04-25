<template>
  <div class="document-editor">
    <div class="document-editor-sidebar">
      <headings-outline :document="liveDocument" :scrollableElement="scrollableElement" :disabled="disabled" />

      <div class="stats">
        <div class="last-saved">Last saved: {{ lastSaved }}</div>
        <div class="words">Words: {{ editorStats.words }}</div>
        <div class="characters">Characters: {{ editorStats.characters }}</div>
      </div>
    </div>

    <div class="scrollable">
      <div class="document-editor-main">
        <input ref="title"
          type="text"
          class="doc-title"
          placeholder="Title…"
          v-model="title"
          v-if="contentDocumentPair"
          @input="onTitleChange"
          :disabled="disabled"
        />

        <ckeditor ref="editor"
          :editor="editor"
          :config="editorConfig"
          :value="documentContent"
          @input="onBodyChange"
          v-if="contentDocumentPair"
          @ready="onReady"
          :disabled="disabled"
        ></ckeditor>
      </div>

      <div class="document-spacer" @click="focusEditorAtEnd"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.document-editor {
  position: relative;
  height: calc(100% - 52px);
}

// For a bit of comfort when typing near the bottom of the window.
$padding_at_bottom: 10px;
.scrollable {
  height: calc(100% - #{$padding_at_bottom});
  overflow-x: hidden;
  overflow-y: scroll;
}

.document-editor-main {
  max-width: 750px;
  margin: 0 auto;
  background-color: white;
}
.document-editor-sidebar {
  position: absolute;
  top: 55px;
  left: 10px;
  bottom: 0;
  padding-top: 23px;

  max-width: 300px;
  width: calc(50% - 375px - 15px);
  background-color: white;

  .headings-outline {
    overflow-y: scroll;
    height: calc(100% - 100px);
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
// Responsiveness for editor and headings sidebar.
@media (min-width:950px) and (max-width:1400px) {
  .document-editor-main {
    margin-left: 200px;
  }
  .document-editor-sidebar {
    min-width: 184px;
  }
}
@media (max-width:950px) {
  .document-editor-sidebar {
    display: none;
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

import HeadingsOutline from '@/components/HeadingsOutline'
import util from '@/lib/util'

import Vue from 'vue'
import { mapState, mapGetters } from 'vuex'
import { DateTime } from 'luxon'

const _ = require('lodash')

export default {
  name: 'DocumentEditor',

  props: {
    contentDocumentPair: {
      default: null,
      type: Object
    },

    disabled: {
      default: true,
      type: Boolean
    }
  },

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

  beforeDestroy () {
    this.$store.dispatch('deregisterEditor')
  },

  components: {
    HeadingsOutline
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
      editsMade: false
    }
  },

  computed: {
    ...mapState(['currentUser', 'sidebarTarget']),
    ...mapGetters(['getContent']),

    content () {
      if (_.isNil(this.contentDocumentPair)) { return null }
      // HACK Re-retrieve the content object from the list since updates aren't flowing through.
      const content = this.contentDocumentPair.content
      if (_.isNil(content)) { return null }
      return this.getContent(content.id)
    },

    document () {
      if (_.isNil(this.contentDocumentPair)) { return null }
      return this.contentDocumentPair.document
    },

    // Returns a representation of this document that updates with typing.
    liveDocument () {
      return {
        title: this.document.title,
        content: this.documentContent
      }
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

      editor.keystrokes.set('Ctrl+Shift+7', (data, cancel) => {
        _.noop(data, cancel)
        editor.execute('numberedList')
      })

      editor.keystrokes.set('Ctrl+Shift+8', (data, cancel) => {
        _.noop(data, cancel)
        editor.execute('bulletedList')
      })

      editor.keystrokes.set('Ctrl+Shift+9', (data, cancel) => {
        _.noop(data, cancel)
        editor.execute('todoList')
      })

      editor.keystrokes.set('Ctrl+Alt+1', (data, cancel) => {
        _.noop(data, cancel)
        editor.execute('heading', { value: 'heading1' } )
      })

      editor.keystrokes.set('Ctrl+Alt+2', (data, cancel) => {
        _.noop(data, cancel)
        editor.execute('heading', { value: 'heading2' } )
      })

      editor.keystrokes.set('Ctrl+Alt+3', (data, cancel) => {
        _.noop(data, cancel)
        editor.execute('heading', { value: 'heading3' } )
      })

      // Ctrl or Cmd + / to focus the search bar.
      editor.keystrokes.set(['Ctrl', 191], (data, cancel) => {
        _.noop(data, cancel)

        this.$store.dispatch('showSidebar')

        Vue.nextTick(() => {
          const search = document.querySelector('#search-by-title')
          if (search) {
            search.focus()
          }
        })
      })

      this.setUIAfterSearch(editor)
      this.$store.dispatch('registerEditor', editor)
    },

    setUIAfterSearch (editor) {
      if (this.$route.name === 'Search') {
        this.$router.replace({ name: 'Document', params: { id: this.$route.params.id } })
        editor.sourceElement.focus()
        this.$store.commit('setTargetFolder', this.content.parent)
      }
    },

    onTitleChange () {
      this.editsMade = true
      this.queueSave(true)
    },

    onBodyChange (content) {
      // Arguments: content, event, editor

      // Update the document's content. Do this manually so the backend doesn't overwrite
      // the editor's content with the lazy saving.
      if (_.isString(content)) {
        this.documentContent = content
        this.editsMade = true
      }

      this.queueSave(true)
    },

    cancelPendingSave () {
      this.$store.dispatch('cancelSavingDocumentTimer')
    },

    queueSave (cancelPending = false) {
      if (cancelPending) {
        this.cancelPendingSave()
      }

      const saver = this.saveDocument()
      this.$store.dispatch('startSavingDocumentTimer', saver)
    },

    saveDocument () {
      const _this = this

      if (!this.editsMade) {
        // The editor is being asked to save its contents, but no changes have been made by the user.
        // This can happen if the user is browsing through documents, for which there isn't a need
        // to update the doc.
        return () => {
          return new Promise((resolve) => {
            _this.cancelPendingSave()
            resolve()
          })
        }
      }

      return () => {
        _this.cancelPendingSave()

        const data = {
          title: _.trim(_this.title),
          content: _this.documentContent,
          updated: new Date()
        }

        const onSuccess = () => {
          console.log('Saved document:', _this.document.title)

          // Update the URL if the title has changed.
          const routeId = util.getIdFromRouteParam(_this.$route.params.id)
          const stillLookingAtTheSameDoc = routeId === _this.content.key && routeId === _this.document.id
          if (stillLookingAtTheSameDoc) {
            const urlId = util.getDocUrlId(_this.document)
            if (_this.$route.path !== `/doc/${urlId}`) {
              _this.$router.replace({ name: 'Document', params: { id: urlId }})
            }
          }
        }

        const onError = error => {
          console.error('Error occured when saving a document:', error)
        }

        return this.$store.dispatch('updateDocument', {
          content: _this.content,
          document: _this.document,
          data,
          onSuccess,
          onError
        })
      } // end closure
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
