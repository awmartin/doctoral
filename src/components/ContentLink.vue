<template>
  <div class="content-link">
    <router-link :to="{ name: 'Document', params: { id: urlId } }" :class="contentClass" v-if="isDocument">
      <file-document-outline-icon />
      {{ title }}
    </router-link>

    <a @click="targetThisFolder" :class="contentClass" v-if="isFolder">
      <folder-outline-icon v-if="isFolder" />
      {{ title }}
    </a>
  </div>
</template>

<style lang="scss" scoped>
a {
  display: block;
  padding: 6px 5px 6px 10px;

  cursor: pointer;

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

// .material-design-icon {
//   font-size: 1.2rem;
// }
</style>

<script>
import FileDocumentOutlineIcon from 'vue-material-design-icons/FileDocumentOutline'
import FolderOutlineIcon from 'vue-material-design-icons/FolderOutline'
const _ = require('lodash')

export default {
  name: 'ContentLink',

  props: ['content'],

  components: {
    FileDocumentOutlineIcon,
    FolderOutlineIcon
  },

  computed: {
    urlId () {
      if (_.isNil(this.content)) { return '' }

      const trimTitle = _.trim(this.content.title)
      const titleForUrl = _.replace(trimTitle, /[^a-zA-Z0-9]/g, '-')
      const sanitizedTitleUrl = _.replace(titleForUrl, /[0]{1,}/, '-')
      const titleUrl = _.trim(sanitizedTitleUrl, '-')
      return `${this.routeKey}-${titleUrl}`
    },

    routeKey () {
      if (this.isDocument) {
        return this.content.key
      } else {
        return this.content.id
      }
    },

    routeId () {
      const elts = _.split(this.$route.params.id, '-')
      return _.head(elts)
    },

    contentClass () {
      if (this.routeId === this.content.key || this.routeId === this.content.id) {
        return `${this.contentType} selected`
      } else {
        return `${this.contentType}`
      }
    },

    title () {
      return _.isNil(this.content) ? '' : this.content.title
    },

    contentType () {
      return this.content.type
    },

    isDocument () {
      return this.contentType === 'Document'
    },

    isFolder () {
      return this.contentType === 'Folder'
    }
  },

  methods: {
    targetThisFolder () {
      this.$store.commit('pushTargetFolder', this.content)
    }
  }
}
</script>
