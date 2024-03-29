<template>
  <div class="document-editor">

    <div class="document-editor-sidebar" v-if="!fullwidth && !splitView">
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
      <div :class="documentEditorMainClass">
        <input ref="title"
          type="text"
          class="doc-title"
          placeholder="Title…"
          v-model="title"
          v-if="document"
          @input="onTitleChange"
          :disabled="disabled"
          @focus="focusCallback(document.id)"
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

  &.fullwidth {
    width: 100%;
    max-width: 100%;
  }
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
  .document-editor-main.single {
    margin-left: 200px;
    &.fullwidth {
      margin-left: 0;
    }
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
import ImageInsert from '@ckeditor/ckeditor5-image/src/imageinsert'
import ImageTextAlternative from '@ckeditor/ckeditor5-image/src/imagetextalternative'
import AutoImage from '@ckeditor/ckeditor5-image/src/autoimage'

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
import todoslib from '@/lib/todos'
import util from '@/lib/util'

import { mapState, mapGetters } from 'vuex'

const _ = require('lodash')

class Uploader {
  constructor(store, loader, document) {
    this.store = store
    this.loader = loader
    this.document = document
  }

  upload() {
    return this.loader.file.then(file => this.store.dispatch('uploadFileForDocument', {
      file,
      document: this.document
    }))
    .then(url => {
      return { default: url }
    })
    .catch(error => {
      console.error(error)
    })
  }
}

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
    },

    splitView: {
      default: false,
      type: Boolean
    },

    focusCallback: {
      default: _.noop,
      type: Function
    }
  },

  created () {
    // In case the user edits the title, which triggers saving, before focusing the editor.
    // Populate this field here so saving doesn't wipe out content.
    this.documentBody = this.document.body
  },

  mounted () {
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
          ImageInsert,
          ImageTextAlternative,
          AutoImage,

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
            'imageInsert',
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

      // These functions have to be in data because Vue messes up the interface
      // when included in methods. I.e. .cancel() isn't available.
      save: _.debounce(() => {
        this.save_()
      }, 3000),

      showSavingMessage: _.debounce(() => {
        this.$store.commit('setIsSavingDocument', true)
      }, 3000, { 'leading': true }),
    }
  }, // data

  computed: {
    ...mapState(['currentUser', 'contents']),
    ...mapGetters(['getContent', 'sidebarTargetFolder']),

    content () {
      return this.document?.content
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

          // Set the tab title to the new document title.
          document.title = `Doctoral | ${newValue}`
        }
      }
    },

    lastSaved () {
      const date = this.document.updated
      const formattedDate = util.formatDate(date)
      const formattedTime = util.formatTime(date)
      return `${formattedDate} at ${formattedTime}`
    },

    documentEditorMainClass () {
      let tr = 'document-editor-main'
      if (this.fullwidth) {
        tr += ' fullwidth'
      }
      if (this.splitView) {
        tr += ' split'
      } else {
        tr += ' single'
      }
      return tr
    },

    fullwidth () {
      return this.document?.fullwidth || false
    }
  }, // computed

  methods: {
    onReady (editor) {
      editor.keystrokes.set('Ctrl+S', (data, cancel) => {
        this.forceSave()
        cancel()
      })

      editor.keystrokes.set('Ctrl+Shift+7', (data, cancel) => {
        editor.execute('numberedList')
        cancel()
      })

      editor.keystrokes.set('Ctrl+Shift+8', (data, cancel) => {
        editor.execute('bulletedList')
        cancel()
      })

      editor.keystrokes.set('Ctrl+Shift+9', (data, cancel) => {
        editor.execute('todoList')
        cancel()
      })

      editor.keystrokes.set('Ctrl+Alt+1', (data, cancel) => {
        editor.execute('heading', { value: 'heading1' } )
        cancel()
      })

      editor.keystrokes.set('Ctrl+Alt+2', (data, cancel) => {
        editor.execute('heading', { value: 'heading2' } )
        cancel()
      })

      editor.keystrokes.set('Ctrl+Alt+3', (data, cancel) => {
        editor.execute('heading', { value: 'heading3' } )
        cancel()
      })

      // Ctrl or Cmd + / to focus the search bar.
      editor.keystrokes.set(['Ctrl', util.keycodes.slash], (data, cancel) => {
        this.focusSidebarSearch()
        cancel()
      })

      editor.plugins.get("FileRepository").createUploadAdapter = loader => {
        return new Uploader(this.$store, loader, this.document)
      }

      editor.editing.view.document.on( 'change:isFocused', ( evt, data, isFocused ) => {
        if (isFocused) {
          this.focusCallback(this.document.id)
        }
      } );

      this.$store.dispatch('registerEditor', editor)

      this.focusEditorOnLoad()

      // CKEditorInspector.attach( editor )
    },

    handleTitleKeydownEvent (event) {
      if (this.disabled) { return }

      const saveShortcut = event.key === 's' && (event.metaKey || event.ctrlKey)
      const focusSearchShortcut = event.key === '/' && (event.metaKey || event.ctrlKey)

      if (saveShortcut) {
        this.forceSave()
        event.preventDefault()
      } else if (focusSearchShortcut) {
        this.focusSidebarSearch()
      }
    },

    focusEditorOnLoad () {
      if (this.$route.name === 'Document') {

        // Regular document loading. Just focus the editor.
        this.focusEditor()

      } else if (this.$route.name === 'DocumentSplit') {

        this.focusEditor()

      } else if (this.$route.name === 'Search') {

        // If we're loading after a search, also change the route and set the sidebar target folder.
        this.$router.replace({ name: 'Document', params: { id: this.$route.params.id } })
        this.$store.dispatch('setSidebarFolderAndFocus', this.content.parent)
        this.focusEditor()

      } else if (this.$route.name === 'NewDocument') {

        // Focus the title field when creating a new document.
        this.$router.replace({ name: 'Document', params: { id: this.$route.params.id } })
        this.$refs.title.focus()
        this.$refs.title.select()

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

    onTitleChange () {
      if (this.disabled) { return }

      this.editsMade = true
      this.save()
      this.showSavingMessage()
    },

    onBodyChange (body) {
      if (this.disabled) { return }

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
      if (this.disabled) {
        return new Promise((resolve, reject) => {
          _.noop(reject)
          resolve()
        })
      }

      this.save.cancel()
      this.showSavingMessage.cancel()
      this.editsMade = true
      console.debug('Force-saving!')
      return this.save_()
    },

    save_ () {
      if (!this.editsMade || this.disabled) {
        // The editor is being asked to save its contents, but no changes have been made by the user.
        // This can happen if the user is browsing through documents, for which there isn't a need
        // to update the doc.
        return new Promise((resolve, reject) => {
          _.noop(reject)
          resolve(null)
        })
      }

      this.document.setBody(this.documentBody)

      // Set snippets for the tags found in this document.
      const tagsAndSnippets = tagslib.extractFromHtml(document, this.documentBody)
      this.content.setTags(tagsAndSnippets)

      const todosExtractor = new todoslib.TodoExtractor(document)
      const todos = todosExtractor.extractFromHtml(this.documentBody)
      this.content.setTodos(todos)

      const onSuccess = () => {
        console.log('Saved document:', this.document.id, this.document.title)

        this.editsMade = false
        this.$store.commit('setIsSavingDocument', false)
        this.showSavingMessage.cancel()

        this.updateUrlIfTitleChanged()
      }

      const onError = error => {
        this.editsMade = false
        this.$store.commit('setIsSavingDocument', false)
        this.showSavingMessage.cancel()
        console.error('Error occured when saving a document:', error)
      }

      return this.$store.dispatch('updateDocument', {
        document: this.document
      }).then(onSuccess).catch(onError)
    },

    updateUrlIfTitleChanged () {
      const leftRouteId = util.getIdFromRouteParam(this.$route.params.id)
      const lookingAtSameDocOnLeft = leftRouteId === this.document.id
      const urlId = this.document.urlId()

      if (this.$route.name === 'DocumentSplit') {
        const rightRouteId = util.getIdFromRouteParam(this.$route.params.idsplit)
        const lookintAtSameDocOnRight = rightRouteId === this.document.id

        if (lookingAtSameDocOnLeft) {
          const expectedPath = `/doc/${urlId}/${rightRouteId}`
          if (this.$route.path !== expectedPath) {
            // Change the url term for the left-side panel.
            this.$router.replace({ name: 'DocumentSplit', params: { id: urlId, idsplit: rightRouteId } })
          }
        } else if (lookintAtSameDocOnRight) {
          const expectedPath = `/doc/${leftRouteId}/${urlId}`
          if (this.$route.path !== expectedPath) {
            // Change the url term for the right-side panel.
            this.$router.replace({ name: 'DocumentSplit', params: { id: leftRouteId, idsplit: urlId } })
          }
        }
      } else {
        if (lookingAtSameDocOnLeft) {
          const expectedPath = `/doc/${urlId}`
          if (this.$route.path !== expectedPath) {
            // Change the url term for the only doc.
            this.$router.replace({ name: 'Document', params: { id: urlId }})
          }
        }
      }
    },

    focusEditor () {
      if (this.disabled) { return }

      const editor = this.$refs.editor

      if (_.isNil(editor) || _.isNil(editor.$_instance)) { return }
      editor.$_instance.focus({
        preventScroll: true
      })

      return editor
    },

    focusEditorAtStart () {
      if (this.disabled) { return }

      const editor = this.focusEditor()

      const model = editor.$_instance.model
      const root = model.document.getRoot()

      model.change(writer => {
        const position = writer.createPositionAt(root, 0)
        writer.setSelection(position)
      })
    },

    focusEditorAtEnd () {
      if (this.disabled) { return }

      const editor = this.focusEditor()

      const model = editor.$_instance.model
      const root = model.document.getRoot()

      model.change(writer => {
        const position = writer.createPositionAt(root, root.maxOffset)
        writer.setSelection(position)
      })
    },

    getPageFeedList (queryText) {
      const linkableContents = _.filter(this.contents, content => content.isDocument || content.isFile)
      const matcher = content => _.includes(_.toLower(content.title), _.toLower(queryText))
      const items = _.filter(linkableContents, matcher)

      const pages = _.map(items, item => {
        console.debug('item.key', item.key)
        const itemWithPageData = _.clone(item)

        itemWithPageData.contentId = item.id // The unique value actually selected.
        itemWithPageData.id = `+${item.title}` // Displayed text.
        itemWithPageData.documentKey = item.key

        return itemWithPageData
      })

      // Add an item that enables a user to create a new document inline.
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
      const itemElement = document.createElement('span')

      itemElement.classList.add('custom-item')
      itemElement.id = `mention-list-item-id-${ item.contentId }`
      itemElement.textContent = `${ item.title } `

      return itemElement
    },

    getTagFeedList (queryText) {
      // Helps ensure that the Markdown shortcut, # + space, still works.
      if (_.size(queryText) < 2 || _.isEmpty(queryText) || !_.isString(queryText)) { return [] }

      // Only alphanumerics
      const firstNonAlphaNumericIndex = queryText.search(/[^a-zA-Z0-9]/)
      let tag = queryText
      if (firstNonAlphaNumericIndex > 0) {
        tag = queryText.slice(0, firstNonAlphaNumericIndex)
      }

      // Otherwise, just return what the user is typing, since we want to enable creating
      // hashtags inline with the text, instead of a managed external list.
      return [{
        id: `#${tag}`,
        contentId: tag
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

              let id = modelAttributeValue.documentKey

              const creatingNewDocument = _.isNil(id)
              if (creatingNewDocument) {
                // Generate an id (Content key) for the new Document.
                id = util.generateId()
                modelAttributeValue.contentId = id // HACK To avoid the duplication problem.
                modelAttributeValue.key = id
                modelAttributeValue.documentKey = id

                // Remove the 'CREATE ' part of the title.
                const title = _.startCase(modelAttributeValue.title.slice(7))

                const onSuccess = document => {
                  console.log('Created document inline', document.title)
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
