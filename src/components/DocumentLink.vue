<template>
  <router-link :to="{name:'Document', params:{id: urlId}}" :class="documentClass">
    <file-document-outline-icon />
    {{ title }}
  </router-link>
</template>

<style lang="scss" scoped>
.document {
  display: block;
  padding: 6px 5px 6px 10px;
  &.selected {
    background-color: #eee;
  }
  &:hover {
    background-color: lighten(lightskyblue, 10%);
  }
  &:active {
    background-color: lightskyblue;
  }
}
</style>

<script>
import FileDocumentOutlineIcon from 'vue-material-design-icons/FileDocumentOutline'
const _ = require('lodash')

export default {
  name: 'DocumentLink',

  props: ['document'],

  components: {
    FileDocumentOutlineIcon
  },

  computed: {
    urlId () {
      if (_.isNil(this.document)) { return '' }

      const trimTitle = _.trim(this.document.title)
      const titleForUrl = _.replace(trimTitle, /[^a-zA-Z0-9]/g, '-')
      const sanitizedTitleUrl = _.replace(titleForUrl, /[0]{1,}/, '-')
      return `${this.document.id}-${sanitizedTitleUrl}`
    },

    routeId () {
      const elts = _.split(this.$route.params.id, '-')
      return _.head(elts)
    },

    documentClass () {
      if (this.routeId === this.document.id) {
        return 'document selected'
      } else {
        return 'document'
      }
    },

    title () {
      return _.isNil(this.document) ? '' : this.document.title
    }
  }
}
</script>