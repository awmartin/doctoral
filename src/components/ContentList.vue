<template>
  <content-link v-for="content in folderContents"
    v-bind:key="content.id"
    v-bind:content="content">
  </content-link>
</template>

<style lang="scss" scoped>

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
    folders () {
      return _.filter(this.contents, Content.isContentForFolder)
    },

    documents () {
      return _.filter(this.contents, Content.isContentForDocument)
    },

    files () {
      return _.filter(this.contents, Content.isContentForFile)
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

        let folders = this.folders
        let documents = this.documents
        let files = this.files
        folders.sort(this.sorter)
        documents.sort(this.sorter)
        files.sort(this.sorter)

        return _.concat(folders, documents, files)
      } else {
        let contents = this.contents
        contents.sort(this.sorter)
        return contents
      }
    }
  }  // computed
}
</script>
