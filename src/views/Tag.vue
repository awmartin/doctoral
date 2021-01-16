<template>
  <div class="tag-detail">
    <Sidebar />

    <div class="body">
      <div class="header">
        <breadcrumb :content="tagContent" />
      </div>

      <h1>Documents with {{ hashtag }}</h1>

      <div class="tags-toolbar">
        <toggle-button field="tagViewLayout" value="document-tree" action="viewTagsAsDocumentTree">
          <file-tree-icon />
        </toggle-button>

        <toggle-button field="tagViewLayout" value="flat-list" action="viewTagsAsFlatList">
          <view-list-icon />
        </toggle-button>
      </div>

      <div class="tags-list">
        <div class="document-tree" v-if="tagViewLayout === 'document-tree'">
          <content-link v-for="content in contentsWithTag" :key="content.id" v-bind:content="content" :options="{ classes:'bold' }">
            <div class="snippet" v-for="snippet in snippets[content.id]" :key="snippet.index">
              <span v-html="formatSnippet(snippet.text)"/>
            </div>
          </content-link>
        </div>

        <div class="flat-list" v-if="tagViewLayout === 'flat-list'">
          <router-link class="snippet" v-for="snippet in allSnippets" :key="snippet.index" :to="{ name: 'Document', params: { id: snippet.url } }">
            <span class="text" v-html="formatSnippet(snippet.text)" />
            <span>&nbsp;&mdash;&nbsp;</span>
            <span class="document-title" v-html="formatTitle(snippet.documentTitle)" />
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tag-detail {
  position: relative;
  display: flex;
  height: calc(100% - 36px);
}

.body {
  height: 100%;
  width: 82%;
}
// Responsiveness for sidebar.
@media (max-width:1160px) {
  .body {
    width: 100%;
  }
}

.header {
  height: 32px;
  padding: 10px 0;

  display: flex;
  justify-content: space-between;
  align-items: center;
}
h1 {
  font-size: 1.5rem;
  font-weight: 300;
  margin: 0 10px;
  height: 37px;
}
.tags-list {
  overflow-y: scroll;
  height: calc(100% - 52px - 65px - 18px);
  padding-top: 12px;
}

.document-tree {
  .snippet {
    display: flex;
    align-items: center;

    height: 34px;
    margin-left: 30px;

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.flat-list {
  .snippet {
    display: flex;
    align-items: center;

    height: 34px;
    padding: 0 10px;

    &:hover {
      background-color: lightskyblue;
    }

    .text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

.tags-toolbar {
  height: 35px;
  padding: 0 10px;
  button {
    margin-right: 5px;
  }
}
</style>

<script>
import Sidebar from '@/components/Sidebar'
import ContentLink from '@/components/ContentLink'
import Breadcrumb from '@/components/Breadcrumb'
import ToggleButton from '@/components/ToggleButton'

import Content from '@/models/Content'

import util from '@/lib/util'

import { ViewList as ViewListIcon } from 'mdue'
import { FileTree as FileTreeIcon } from 'mdue'

import { mapState, mapGetters } from 'vuex'
const _ = require('lodash')

export default {
  name: 'Tag',

  components: {
    Sidebar,
    ContentLink,
    Breadcrumb,
    ToggleButton,
    ViewListIcon,
    FileTreeIcon
  },

  created () {
    this.loadTagSnippets()
  },

  data () {
    return {
      snippets: {}
    }
  },

  watch: {
    routePath () {
      this.loadTagSnippets()
    }
  },

  computed: {
    ...mapState(['contents', 'tagViewLayout']),
    ...mapGetters(['isLoggedIn']),

    hashtag () {
      return '#' + this.$route.params.id
    },

    contentsWithTag () {
      return _.filter(this.contents, content => _.includes(content.tags, this.hashtag))
    },

    tagContent () {
      return new Content.Content(this.hashtag, 'Tag', false, false, this.hashtag, this.hashtag, 'TAGSLIST')
    },

    routePath () {
      return this.$route.path
    },

    allSnippets () {
      const snippets = _.flatMap(this.contentsWithTag, content => {
        const snippetsWithTag = this.snippets[content.id]
        return _.map(snippetsWithTag, snippet => {
          return {
            ...snippet,
            index: `${content.id}-${snippet.index}`,
            url: content.urlId(),
            documentTitle: content.title
          }
        })
      })
      const dedupedSnippets = _.uniqBy(snippets, _.property('text'))
      return dedupedSnippets
    }
  },

  methods: {
    parseSnippets (rawSnippets) {
      const snippetTexts = JSON.parse(rawSnippets)
      const snippets = _.map(snippetTexts, (text, index) => {
        return { index, text }
      })
      const dedupedSnippets = _.uniqBy(snippets, _.property('text'))
      return dedupedSnippets
    },

    loadTagSnippets () {
      const onSuccess = snippets => {
        this.snippets = _.mapValues(snippets, this.parseSnippets)
      }

      const onError = error => {
        console.error('Error occured when loading tag snippets:', error)
      }

      this.$store.dispatch('loadTagSnippets', {
        tag: this.hashtag,
        onSuccess,
        onError
      })
    },

    viewAsDocumentTree () {
      this.$store.dispatch('viewTagsAsDocumentTree')
    },

    viewAsFlatList () {
      this.$store.dispatch('viewTagsAsFlatList')
    },

    formatSnippet (snippet) {
      const formattedSnippet = _.chain(snippet)
          .replace(/#Important/g, '<strong>#Important</strong>')
          .replace(/#important/g, '<strong>#important</strong>')
          .replace(/#Urgent/g, '<strong>#Urgent</strong>')
          .replace(/#urgent/g, '<strong>#urgent</strong>')
          .replace(/#Priority/g, '<strong>#Priority</strong>')
          .replace(/#priority/g, '<strong>#priority</strong>')
          .replace(this.hashtag, `<mark>${this.hashtag}</mark>`)
          .value()

      return formattedSnippet
    },

    formatTitle (title) {
      return _.replace(util.escapeHtmlChars(title), /\s/g, '&nbsp;')
    }
  }
}
</script>
