<template>
  <div class="tag-detail">
    <Sidebar />

    <div class="body">
      <div class="header">
        <breadcrumb :content="tagContent" />
      </div>

      <h1>Documents with {{ hashtag }}</h1>

      <div class="documents-list">
        <content-link v-for="content in contentsWithTag" :key="content.id" v-bind:content="content" :options="{ classes:'bold' }">
          <div class="snippet" v-for="snippet in snippets[content.id]" :key="snippet.index">{{ snippet.text }}</div>
        </content-link>
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
.header {
  height: 32px;
  padding: 10px 0;

  display: flex;
  justify-content: space-between;
  align-items: center;
}
h1 {
  font-weight: 300;
  margin: 10px;
  height: 45px;
}
.documents-list {
  overflow-y: scroll;
  height: calc(100% - 52px - 65px);
}
.snippet {
  margin-left: 30px;
  padding: 2px 0;
}
</style>

<script>
import Sidebar from '@/components/Sidebar'
import ContentLink from '@/components/ContentLink'
import Breadcrumb from '@/components/Breadcrumb'
import Content from '@/models/Content'

import { mapState, mapGetters } from 'vuex'
const _ = require('lodash')

export default {
  name: 'Tag',

  components: {
    Sidebar,
    ContentLink,
    Breadcrumb
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
    ...mapState(['contents']),
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
    }
  },

  methods: {
    parseSnippets (rawSnippets) {
      const snippetTexts = JSON.parse(rawSnippets)
      return _.map(snippetTexts, (text, index) => {
        return { index, text }
      })
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
    }
  }
}
</script>
