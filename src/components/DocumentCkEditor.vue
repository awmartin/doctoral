<template>
  <div class="document-editor">

    <div class="document-editor-sidebar">
      <document-tag-cloud :content="content" ref="tags-cloud"/>

      <headings-outline
        :document="liveDocument"
        :scrollableElement="scrollableElement"
        :disabled="disabled"
        ref="headings-outline"
      />

      <div class="stats" ref="doc-stats">
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
          v-if="document"
          @input="onTitleChange"
          :disabled="disabled"
          @keyup.enter.exact="focusEditorAtStart"
          @keyup.down.exact="focusEditorAtStart"
          @keydown="handleTitleKeydownEvent"
        />

        <ckeditor ref="editor"
          :editor="editor"
          :config="editorConfig"
          :model-value="documentBody"
          @input="onBodyChange"
          v-if="document"
          @ready="onReady"
          :disabled="disabled"
        />
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
  top: 0px;
  left: 10px;
  bottom: 0;

  display: flex;
  flex-flow: column nowrap;

  max-width: 300px;
  width: calc(50% - 375px - 15px);
  background-color: white;

  .tags {
    margin-top: 35px; // To make room for the sidebar button when the browser window is narrow.
    margin-bottom: 10px;
    min-height: 35px;
    overflow-y: scroll;
  }

  .headings-outline {
    flex-grow: 2;
    overflow-y: scroll;
    height: calc(100% - 150px);
  }

  .stats {
    margin: 10px 0;
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

import LinkPlugin from '@/editors/ckeditor5-link/link' // Original: '@ckeditor/ckeditor5-link/src/link'
import AutoLink from '@ckeditor/ckeditor5-link/src/autolink'
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

import MentionPlugin from '@ckeditor/ckeditor5-mention/src/mention'

import Range from '@ckeditor/ckeditor5-engine/src/model/range'
import findAttributeRange from '@ckeditor/ckeditor5-typing/src/utils/findattributerange'

// Uncomment if needed.
// import CKEditorInspector from '@ckeditor/ckeditor5-inspector'

import DocumentTagCloud from '@/components/DocumentTagCloud'
import HeadingsOutline from '@/components/HeadingsOutline'
import tagslib from '@/lib/tags'
import util from '@/lib/util'

import { mapState, mapGetters } from 'vuex'

const _ = require('lodash')
const uniqueSlug = require('unique-slug')

export default {
  name: 'DocumentEditor',

  props: {
    document: {
      default: null,
      type: Object,
      required: true
    },

    disabled: {
      default: true,
      type: Boolean
    }
  },

  created () {
    // In case the user edits the title, which triggers saving, before focusing the editor.
    // Populate this field here so saving doesn't wipe out content.
    this.documentBody = this.document.body
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

  beforeUnmount () {
    this.$store.dispatch('deregisterEditor')
  },

  components: {
    HeadingsOutline,
    DocumentTagCloud
  },

  data () {
    return {
      documentBody: '',
      scrollableElement: null,
      editorStats: { words: 0, characters: 0 },
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
          AutoLink,
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
          TableToolbar,

          MentionPlugin,
          this.initMentionCustomization(),
          // AllowLinkTarget
        ],

        mention: {
          feeds: [
            {
              marker: '+',
              feed: this.getPageFeedList,
              itemRenderer: this.getPageFeedItemRenderer,
              minimumCharacters: 2,
            },
            {
              marker: '#',
              feed: this.getTagFeedList
            }
          ],
        },

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
      editsMade: false,

      save: _.debounce(function(){
        this.save_()
      }, 3000),

      showSavingMessage: _.debounce(function() {
        this.$store.commit('setIsSavingDocument', true)
      }, 3000, { 'leading': true })
    }
  }, // data

  computed: {
    ...mapState(['currentUser', 'contents']),
    ...mapGetters(['getContent', 'sidebarTargetFolder']),

    content () {
      return this.getContent(this.document?.content?.id)
    },

    // Returns a representation of this document that updates with typing.
    liveDocument () {
      return {
        title: this.document.title,
        content: this.documentBody
      }
    },

    title: {
      get () {
        if (_.isNil(this.document)) { return '' }
        return this.document.title
      },
      set (newValue) {
        if (!_.isNil(this.document)) {
          this.document.setTitle(newValue)
        }
      }
    },

    lastSaved () {
      const date = this.document.updated
      const formattedDate = util.formatDate(date)
      const formattedTime = util.formatTime(date)
      return `${formattedDate} at ${formattedTime}`
    }
  },

  methods: {
    onReady (editor) {
      editor.keystrokes.set('Ctrl+S', (data, cancel) => {
        this.forceSave()
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
      editor.keystrokes.set(['Ctrl', util.keycodes.slash], (data, cancel) => {
        _.noop(data, cancel)
        this.focusSidebarSearch()
      })

      this.setUIAfterSearch(editor)
      this.$store.dispatch('registerEditor', editor)

      // CKEditorInspector.attach( editor )
    },

    handleTitleKeydownEvent (event) {
      const saveShortcut = event.key === 's' && (event.metaKey || event.ctrlKey)
      const focusSearchShortcut = event.key === '/' && (event.metaKey || event.ctrlKey)

      if (saveShortcut) {
        this.forceSave()
        event.preventDefault()
      } else if (focusSearchShortcut) {
        this.focusSidebarSearch()
      }
    },

    focusSidebarSearch () {
      this.$store.dispatch('showSidebar').then(() => {
        const search = document.querySelector('#search-by-title')
        if (search) {
          search.focus()
        }
      })
    },

    setUIAfterSearch (editor) {
      if (this.$route.name === 'Search') {
        this.$router.replace({ name: 'Document', params: { id: this.$route.params.id } })
        editor.sourceElement.focus()
        this.$store.dispatch('setSidebarFolderAndFocus', this.content.parent)
      }
    },

    onTitleChange () {
      this.editsMade = true
      this.save()
      this.showSavingMessage()
    },

    onBodyChange (body) {
      // Arguments: content, event, editor

      // Update the document's body. Do this manually so the backend doesn't overwrite
      // the editor's content with the lazy saving.
      if (_.isString(body)) {
        this.documentBody = body
        this.editsMade = true
      }

      this.save()
      this.showSavingMessage()
    },

    forceSave () {
      this.save.cancel()
      this.showSavingMessage.cancel()
      this.editsMade = true
      console.debug('Force-saving!')
      return this.save_()
    },

    save_ () {
      if (!this.editsMade) {
        // The editor is being asked to save its contents, but no changes have been made by the user.
        // This can happen if the user is browsing through documents, for which there isn't a need
        // to update the doc.
        return new Promise((resolve, reject) => {
          _.noop(reject)
          resolve(null)
        })
      }

      this.document.setBody(this.documentBody)

      // FIXME This is updated here twice because the backend refers to the document's content reference, but they should be the same reference.
      const tags = tagslib.extractFromHtml(document, this.documentBody)
      this.content.setTags(tags)
      this.document.content.setTags(tags)

      const _this = this
      const onSuccess = () => {
        console.log('Saved document:', _this.document.title)

        _this.editsMade = false
        _this.$store.commit('setIsSavingDocument', false)
        _this.showSavingMessage.cancel()

        // Update the URL if the title has changed.
        const routeId = util.getIdFromRouteParam(_this.$route.params.id)
        const stillLookingAtTheSameDoc = routeId === _this.content.key && routeId === _this.document.id
        if (stillLookingAtTheSameDoc) {
          const urlId = _this.document.urlId()
          if (_this.$route.path !== `/doc/${urlId}`) {
            _this.$router.replace({ name: 'Document', params: { id: urlId }})
          }
        }
      }

      const onError = error => {
        _this.editsMade = false
        _this.$store.commit('setIsSavingDocument', false)
        _this.showSavingMessage.cancel()
        console.error('Error occured when saving a document:', error)
      }

      return this.$store.dispatch('updateDocument', {
        content: _this.content,
        document: _this.document,
        onSuccess,
        onError
      })
    },

    focusEditor () {
      const editor = this.$refs.editor

      if (_.isNil(editor) || _.isNil(editor.$_instance)) { return }
      editor.$_instance.focus({
        preventScroll: true
      })

      return editor
    },

    focusEditorAtStart () {
      const editor = this.focusEditor()

      const model = editor.$_instance.model
      const root = model.document.getRoot()

      model.change(writer => {
        const position = writer.createPositionAt(root, 0)
        writer.setSelection(position)
      })
    },

    focusEditorAtEnd () {
      const editor = this.focusEditor()

      const model = editor.$_instance.model
      const root = model.document.getRoot()

      model.change(writer => {
        const position = writer.createPositionAt(root, root.maxOffset)
        writer.setSelection(position)
      })
    },

    getPageFeedList (queryText) {
      const matcher = content => _.includes(_.toLower(content.title), _.toLower(queryText))
      const items = _.filter(this.contents, matcher)

      const pages = _.map(items, item => {
        const itemWithPageData = _.clone(item)

        itemWithPageData.contentId = item.id // The unique value actually selected.
        itemWithPageData.id = `+${item.title}` // Displayed text.

        return itemWithPageData
      })

      const newDocumentPrompt = {
        title: `CREATE ${queryText}`,
        contentId: null,
        id: `+${queryText}`,
        key: null
      }
      pages.push(newDocumentPrompt)

      return pages
    },

    getPageFeedItemRenderer (item) {
      const itemElement = document.createElement( 'span' )

      itemElement.classList.add('custom-item')
      itemElement.id = `mention-list-item-id-${ item.contentId }`
      itemElement.textContent = `${ item.title } `

      return itemElement
    },

    getTagFeedList (queryText) {
      // Helps ensure that the Markdown shortcut, # + space, still works.
      if (_.size(queryText) < 2 || _.isEmpty(queryText)) { return [] }

      // Otherwise, just return what the user is typing, since we want to enable creating
      // hashtags inline with the text, instead of a managed external list.
      return [{
        id: `#${queryText}`,
        contentId: queryText
      }]
    },

    initMentionCustomization () {
      const _this = this

      function MentionCustomization( editor ) {
        // Downcast the model 'mention' text attribute to a view <a> element.
        editor.conversion.for('downcast').attributeToElement({
          model: 'mention',

          view: ( modelAttributeValue, viewWriter ) => {
            // Do not convert empty attributes (lack of value means no mention).
            if (!modelAttributeValue) {
              return
            }

            const hashTag = modelAttributeValue.id || modelAttributeValue._text

            const isNotH1 = _.size(hashTag) >= 2 && hashTag[1] !== ' '

            const startsWithHash = _.startsWith(hashTag, '#')
            const isTagMention = startsWithHash && isNotH1

            const startsWithPlus = _.startsWith(hashTag, '+')
            const isPageMention = startsWithPlus && isNotH1

            if (isTagMention) {
              const tagElement = viewWriter.writer.createAttributeElement( 'span', {
                class: 'mention',
                'data-tag': modelAttributeValue.id || modelAttributeValue._text
              })

              return tagElement
            } else if (isPageMention) {

              let id = modelAttributeValue.key
              const creatingNewDocument = _.isNil(id)
              if (creatingNewDocument) {
                id = uniqueSlug() + uniqueSlug() + uniqueSlug()
                modelAttributeValue.contentId = id // HACK To avoid the duplication problem.
                modelAttributeValue.key = id

                const title = _.startCase(modelAttributeValue.title.slice(7))

                const onSuccess = document => {
                  console.log('Created document', document)
                }

                const onError = error => {
                  console.error('Error while creating document:', error)
                }

                _this.$store.dispatch('createDocument', { parent: _this.sidebarTargetFolder, id, title, onSuccess, onError })
              } // end create document

              const href = `#/doc/${id}`

              const viewElement = viewWriter.writer.createAttributeElement( 'a', {
                class: 'mention',
                href,
              }, {
                priority: 10
              })

              // Change the mention node in the model to a linkHref node.
              const model = editor.model
              const document = model.document
              const selection = document.selection
              const position = selection.getFirstPosition()

              const mentionRange = findAttributeRange( position, 'mention', selection.getAttribute( 'mention' ), model )
              const mentionLength = _.size(hashTag)
              const linkRange = new Range(mentionRange.end.getShiftedBy(-mentionLength - 1), mentionRange.end.getShiftedBy(-1))

              model.change(writer => {
                writer.removeAttribute( 'mention', linkRange )
                writer.setAttribute( 'linkHref', href, linkRange )
              })

              return viewElement
            } else {
              return null
            }
          },

          converterPriority: 'high'
        })
      } // end MentionCustomization

      return MentionCustomization
    } // end initMentionCustomization
  } // methods
}
</script>
