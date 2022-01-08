<template>
  <div class="tag-detail" v-if="isLoggedIn">
    <Sidebar />

    <div class="body">
      <div class="header">
        <breadcrumb :content="tagContent" />
      </div>

      <h1>Documents with {{ hashtag }}</h1>

      <div class="tags-toolbar">
        <toggle-button field="tagViewLayout" value="document-tree" action="viewTagsAsDocumentTree" title="Group by document">
          <file-document-outline-icon />
        </toggle-button>

        <toggle-button field="tagViewLayout" value="flat-list" action="viewTagsAsFlatList" title="Flat list">
          <view-list-icon />
        </toggle-button>

        <toggle-button field="tagViewLayout" value="grouped-tree" action="viewTagsAsGroupedTree" title="Group by tag">
          <file-tree-icon />
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

        <div class="grouped-tree" v-if="tagViewLayout === 'grouped-tree'">
          <div class="tag-tree" v-for="tag in tagTreeList" :key="tag">
            <div v-if="hasItems(tagTree[tag])">
              <router-link class="tag" :to="{ name: 'Tag', params: { id: trimHashtag(tag) } }">
                <h2>{{ tag }}</h2>
              </router-link>

              <router-link class="subtag snippet" v-for="subtag in tagTree[tag]" :key="subtag.index" :to="{ name: 'Document', params: { id: subtag.url } }">
                <span class="text" v-html="formatSnippet(subtag.text)" />
                <span>&nbsp;&mdash;&nbsp;</span>
                <span class="document-title" v-html="formatTitle(subtag.documentTitle)" />
              </router-link>
            </div>
          </div>

          <div class="tag-tree" v-for="document in untaggedTreeList" :key="document.documentKey">
            <div v-if="hasItems(document.snippets)">
              <router-link class="document" :to="{ name: 'Document', params: { id: document.url } }">
                <h2 class="text">{{ document.documentTitle }}</h2>
              </router-link>

              <router-link class="subtag snippet" v-for="snippet in document.snippets" :key="snippet.index" :to="{ name: 'Document', params: { id: document.url } }">
                <span class="text" v-html="formatSnippet(snippet.text)" />
              </router-link>
            </div>
          </div>
        </div>


        <div class="filler" />
      </div> <!-- tags-list -->
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
  .content-link {
    margin-bottom: 20px;
  }
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

.grouped-tree {
  .tag, .document {
    display: block;
    margin-top: 20px;

    h2 {
      padding-left: 10px;
      height: 34px;

      display: flex;
      align-items: center;

      font-size: 1.0rem;
      margin: 0;
    }

    :hover {
      background-color: lightskyblue;
    }
  }

  .document.snippet {
    :hover {
      background-color: lightskyblue;
    }
  }

  .subtag {
    display: flex;
    align-items: center;

    height: 34px;
    padding: 0 10px 0 34px;

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

.filler {
  height: 100px;
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
import { FileDocumentOutline as FileDocumentOutlineIcon } from 'mdue'

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
    FileTreeIcon,
    FileDocumentOutlineIcon
  },

  created () {
    if (this.isLoggedIn) {
      this.loadTagSnippets()
    }
  },

  mounted () {
    document.title = `Doctoral | ${this.hashtag}`
  },

  data () {
    return {
      snippets: {}
    }
  },

  watch: {
    routePath () {
      this.snippets = {}
      this.loadTagSnippets()
      document.title = `Doctoral | ${this.hashtag}`
    },

    isLoggedIn (isLoggedIn, oldIsLoggedIn) {
      if (isLoggedIn && !oldIsLoggedIn) {
        this.loadTagSnippets()
      }
    }
  },

  computed: {
    ...mapState(['contents', 'tagViewLayout']),
    ...mapGetters(['isLoggedIn']),

    hashtag () {
      return '#' + this.$route.params.id
    },

    contentsWithTag () {
      const tr = _.filter(this.contents, content => _.includes(content.tags, this.hashtag))
      tr.sort((a, b) => a.title > b.title ? 1 : -1)
      return tr
    },

    tagContent () {
      return new Content.Content(this.hashTag, { title: this.hashtag, type: 'Tag', key: this.hashtag, parent: 'TAGSLIST' })
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
    },

    // Return an array of all the secondary tags.
    tagTreeList () {
      const tags = _.keys(this.tagTree)
      const topTags = [
        '#Urgent',
        '#Priority',
        '#Important'
      ]
      const otherTags = _.difference(tags, topTags)
      otherTags.sort()

      const otherWithoutUntagged = _.remove(otherTags, tag => tag !== 'Untagged')

      return _.concat(topTags, otherWithoutUntagged)
    },

    // Return a map of all snippets with no secondary tags, grouped by document key.
    untaggedTreeList () {
      const untagged = this.tagTree['Untagged']
      const tr = {}

      _.each(untagged, snippet => {
        if (!_.has(tr, snippet.documentKey)) {
          tr[snippet.documentKey] = {
            documentTitle: snippet.documentTitle,
            documentKey: snippet.documentKey,
            url: snippet.url,
            snippets: []
          }
        }

        tr[snippet.documentKey].snippets.push(snippet)
      })

      return tr
    },

    // Return a map of tag to list of snippets to display.
    tagTree () {
      const hashtagRegex = new RegExp(/#[A-Za-z0-9]*/g)
      const tr = {
        'Untagged': []
      }

      _.each(this.contentsWithTag, content => {
        const snippetsWithTag = this.snippets[content.id] // Array of { text:, index: }

        _.each(snippetsWithTag, snippet => {
          // Check for all the tags in the given snippets and consolidate them.
          const embeddedTags = snippet.text.match(hashtagRegex)

          if (_.size(embeddedTags) === 1) {
            // Doesn't have any secondary tags, so add to the untagged group.
            tr['Untagged'].push({
              text: snippet.text,
              index: `${content.id}-${snippet.index}`,
              url: content.urlId(),
              documentTitle: content.title,
              documentKey: content.key
            })
          } else {
            _.each(embeddedTags, tag => {
              if (!_.has(tr, tag)) {
                tr[tag] = []
              }
  
              tr[tag].push({
                text: snippet.text,
                index: `${content.id}-${snippet.index}`,
                url: content.urlId(),
                documentTitle: content.title,
                documentKey: content.key
              })
            })
          }

        })
      })

      // Ensure all snippets are also tagged with their document-tag equivalent.
      const convertDocumentTitleToHashTag = title => {
        const onlyAlphaNumerics = _.replace(title, /[^A-Za-z0-9]*/g, '')
        return `#${onlyAlphaNumerics}`
      }

      _.each(tr, snippetSet => {
        _.each(snippetSet, snippet => {
          const docTag = convertDocumentTitleToHashTag(snippet.documentTitle)
          if (_.has(tr, docTag)) {
            tr[docTag].push(snippet)
          }
        })
      })

      // If those tags happen to be in the Untagged section, remove them as well.
      const tags = _.remove(_.keys(tr), tag => tag !== 'Untagged')
      const untagged = tr['Untagged']
      const filteredUntagged = []

      _.each(untagged, snippet => {
        const collapsedTitleTag = convertDocumentTitleToHashTag(snippet.documentTitle)
        if (!_.includes(tags, collapsedTitleTag)) {
          filteredUntagged.push(snippet)
        }
      })

      tr['Untagged'] = filteredUntagged

      // Remove the primary tag as it's redundant. The entire view is around this single tag anyway.
      delete tr[this.hashtag]

      // For a given tag, ensure the snippets are unique by text.
      _.each(tr, (snippetSet, tag) => {
        tr[tag] = _.uniqBy(tr[tag], _.property('text'))
      })

      return tr
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
      console.log(`Load tag snippets ${this.hashtag}`)

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
    },

    trimHashtag (tag) {
      return _.trimStart(tag, '#')
    },

    hasItems (tags) {
      return _.size(tags) > 0
    }
  }
}
</script>
