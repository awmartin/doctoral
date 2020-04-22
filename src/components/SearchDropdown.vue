<template>
  <div class="search-dropdown">
    <magnify-icon />

    <input ref="search"
      type="text"
      class="search"
      id="search-by-title"
      placeholder="Search by title"
      v-model="searchQuery"
      @keyup.esc.exact="focusEditor"
      @keyup.enter.exact="openHighlightedResult"
      @keydown.up.exact="previousResult"
      @keydown.down.exact="nextResult"
      @keydown.meta.191.exact="focusEditor"
      @keydown.ctrl.191.exact="focusEditor"
    />

    <div class="search-results" v-if="isSearching">
      <content-link v-for="result in searchResults" 
        :key="result.id"
        :content="result"
        :withClick="clearQuery"
        :class="searchResultClass(result)"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.search-dropdown {
  position: relative;
  flex-grow: 2;
}
input.search {
  font-size: 1.0rem;
  border: none;
  outline: none;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  border-bottom: 1px solid lighten(lightskyblue, 20%);
  width: calc(100% - 25px);

  &:focus {
    margin-top: 1px;
    border-bottom: 2px solid darken(lightskyblue, 10%);
  }
}
.search-results {
  position: absolute;
  width: 300px;
  height: 400px;
  overflow-y: scroll;
  background-color: white;
  border: 2px solid lightskyblue;
  z-index: 2;
  top: 40px;
  padding: 5px;
}
.content-link.result {
  border: 1px solid transparent;
  &.highlighted {
    border: 1px solid lightskyblue;
  }
}
.magnify-icon {
  margin-right: 4px;
}
</style>

<script>
import ContentLink from '@/components/ContentLink'
import util from '@/lib/util'

import MagnifyIcon from 'vue-material-design-icons/Magnify'
import { mapState } from 'vuex'
const _ = require('lodash')

export default {
  name: 'SearchDropdown',

  components: {
    ContentLink,
    MagnifyIcon
  },

  data () {
    return {
      searchQuery: '',
      highlightedSearchIndex: 0
    }
  },

  computed: {
    ...mapState(['contents']),

    contentsWithHome () {
      return _.concat(this.contents, { id: null, title: 'Home', type: 'Folder' })
    },

    searchResults () {
      if (!this.isSearching) { return [] }

      const results = _.filter(this.contentsWithHome, content => _.includes(_.toLower(content.title), this.cleanQuery))

      const sortExactMatchesToTop = (a, b) => {
        return _.startsWith(_.toLower(a.title), this.cleanQuery) && !_.startsWith(_.toLower(b.title), this.cleanQuery) ? -1 : 1
      }

      results.sort(sortExactMatchesToTop)

      return results
    },

    cleanQuery () {
      return _.trim(_.toLower(this.searchQuery))
    },

    isSearching () {
      return !_.isEmpty(_.trim(this.searchQuery))
    },

    highlightedSearchResult () {
      if (_.isFinite(this.highlightedSearchIndex)) {
        return this.searchResults[this.highlightedSearchIndex]
      } else {
        return null
      }
    }
  }, // computed

  methods: {
    clearQuery () {
      this.searchQuery = ''
      this.highlightedSearchIndex = 0
    },

    nextResult () {
      if (_.size(this.searchResults) === 0) { return }

      if (_.isNil(this.highlightedSearchIndex)) {
        this.highlightedSearchIndex = 0
      } else {
        this.highlightedSearchIndex += 1
        if (this.highlightedSearchIndex >= _.size(this.searchResults)) {
          this.highlightedSearchIndex = 0
        }
      }
    },

    previousResult () {
      if (_.size(this.searchResults) === 0) { return }

      if (_.isNil(this.highlightedSearchIndex)) {
        this.highlightedSearchIndex = _.size(this.searchResults) - 1
      } else {
        this.highlightedSearchIndex -= 1
        if (this.highlightedSearchIndex < 0) {
          this.highlightedSearchIndex = _.size(this.searchResults) - 1
        }
      }
    },

    searchResultClass (result) {
      if (_.isObject(this.highlightedSearchResult) && result.id === this.highlightedSearchResult.id) {
        return 'result highlighted'
      } else {
        return 'result'
      }
    },

    openHighlightedResult () {
      if (!_.isObject(this.highlightedSearchResult)) { return }

      if (this.highlightedSearchResult.type === 'Folder') {
        this.openFolder(this.highlightedSearchResult)
      } else if (this.highlightedSearchResult.type === 'Document') {
        this.openDocument(this.highlightedSearchResult)
      }

      this.clearQuery()
    },

    openFolder (result) {
      this.$store.commit('setTargetFolder', result.id)
    },

    openDocument (result) {
      const urlId = util.getDocUrlId(result)
      this.$router.push({ name: 'Search', params: { id: urlId }})
    },

    focusEditor () {
      this.clearQuery()
      this.$store.dispatch('hideSidebar')
      this.$store.dispatch('focusEditor')
    }
  }
}
</script>
