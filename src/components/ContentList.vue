<template>
  <div class="content-list">
    <div class="scrollable">
      <content-link v-for="content in folderContents"
        v-bind:key="content.id"
        v-bind:content="content">
      </content-link>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.content-list {
  position: relative;
}
.scrollable {
  height: 100%;
  overflow-y: scroll;
}
</style>

<script>
import Content from '@/models/Content'
import ContentLink from '@/components/ContentLink'
const _ = require('lodash')

export default {
  name: 'ContentList',

  props: {
    contents: {
      default: _.stubArray,
      type: Array,
      required: true
    },

    direction: {
      default: 'ascending', // ascending, descending
      type: String
    },

    grouping: {
      default: 'none', // none, folders
      type: String
    },

    field: {
      default: 'title', // title, created, updated, starred
      type: String
    }
  },

  components: {
    ContentLink
  },

  computed: {
    unsortedFolders () {
      return _.filter(this.contents, Content.isContentForFolder)
    },

    unsortedDocuments () {
      return _.filter(this.contents, Content.isContentForDocument)
    },

    comparator () {
      const ascending = (a, b) => a > b
      const descending = (a, b) => a < b
      return this.direction === 'ascending' ? ascending : descending
    },

    sorter () {
      // Returns a function that sorts the contents.
      if (this.field === 'created') {
        return (a, b) => this.comparator(a.created, b.created) ? 1 : -1
      } else if (this.field === 'updated') {
        return (a, b) => this.comparator(a.updated, b.updated) ? 1 : -1
      } else if (this.field === 'starred') {
        return (a, b) => this.comparator(a.starred, b.starred) ? 1 : -1
      } else { // title in all other cases
        return (a, b) => this.comparator(_.toLower(a.title), _.toLower(b.title)) ? 1 : -1
      }
    },

    folderContents () {
      if (this.grouping === 'folders') {
        // Separate folders from docs and sort indepenently, then recombine.

        const sortedFolders = _.clone(this.unsortedFolders)
        sortedFolders.sort(this.sorter)
        const sortedDocuments = _.clone(this.unsortedDocuments)
        sortedDocuments.sort(this.sorter)

        return _.concat(sortedFolders, sortedDocuments)
      } else {
        const items =  _.clone(this.contents)
        items.sort(this.sorter)
        return items
      }
    }
  }  // computed
}
</script>
