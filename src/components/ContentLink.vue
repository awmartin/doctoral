<template>
  <div class="content-link">
    <a @click="handleClick" :class="contentClass">
      <slot name="icon">
        <file-document-outline-icon v-if="isDocument" />
        <folder-outline-icon v-if="isFolder" />
      </slot>

      {{ title }}
    </a>

    <!-- <a @click="handleClick" :class="contentClass" v-if="isDocument && hasClickHandler">
      <file-document-outline-icon />
      {{ title }}
    </a>

    <router-link :to="{ name: 'Document', params: { id: urlId } }" :class="contentClass" v-if="isDocument && !hasClickHandler">
      <file-document-outline-icon />
      {{ title }}
    </router-link>

    <a @click="handleClick" :class="contentClass" v-if="isFolder && hasClickHandler">
      <folder-outline-icon />
      {{ title }}
    </a> -->

    <slot></slot>
  </div>
</template>

<style lang="scss" scoped>
a {
  display: block;
  padding: 6px 5px 6px 10px;

  cursor: pointer;

  &.selected {
    background-color: lighten(lightskyblue, 20%);
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
import util from '@/lib/util'

const _ = require('lodash')

export default {
  name: 'ContentLink',

  props: {
    content: {
      default: null
    },
    
    click: {
      default: null
    }
  },

  components: {
    FileDocumentOutlineIcon,
    FolderOutlineIcon
  },

  computed: {
    urlId () {
      if (_.isNil(this.content)) { return '' }

      return util.getDocUrlId(this.content)
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
    },

    hasClickHandler () {
      return _.isFunction(this.click)
    }
  },

  methods: {
    handleClick () {
      if (this.hasClickHandler) {
        this.click()
      } else if (this.isFolder) {
        this.targetThisFolder()
      } else if (this.isDocument) {
        this.openThisDocument()
      } else {
        _.noop()
      }
    },

    targetThisFolder () {
      this.$store.commit('setTargetFolder', this.content.id)
    },

    openThisDocument () {
      this.$router.push({ name: 'Document', params: { id: this.urlId }})
    }
  }
}
</script>
