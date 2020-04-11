<template>
  <div class="content-link">
    <a @click="handleClick" :class="contentClass">
      <slot name="icon">
        <file-document-outline-icon v-if="isDocument" />
        <folder-outline-icon v-if="isFolder" />
      </slot>

      {{ title }}
    </a>

    <slot></slot>
  </div>
</template>

<style lang="scss" scoped>
a {
  display: block;
  padding: 6px 5px 6px 10px;

  cursor: pointer;

  &.normal:hover {
    background-color: lighten(lightskyblue, 10%);
  }
  &.normal:active {
    background-color: lightskyblue;
  }

  &.disabled {
    color: lightgray;
  }
  &.disabled:hover {
    background-color: none !important;
  }
  &.disabled:active {
    background-color: none !important;
  }

  &.selected {
    background-color: lighten(lightskyblue, 20%);
  }
}
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
    },

    withClick: {
      default: null
    },

    disabled: {
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
      if (_.isFunction(this.disabled) && this.disabled(this.content)) {
        return `${this.contentType} disabled`
      } else if (this.routeId === this.content.key || this.routeId === this.content.id) {
        return `${this.contentType} selected`
      } else {
        return `${this.contentType} normal`
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
      if (_.isFunction(this.disabled) && this.disabled(this.content)) { return }

      if (this.hasClickHandler) {
        this.click()
      } else if (this.isFolder) {
        this.targetThisFolder()
      } else if (this.isDocument) {
        this.openThisDocument()
      } else {
        _.noop()
      }

      if (_.isFunction(this.withClick)) {
        this.withClick()
      }
    },

    targetThisFolder () {
      this.$store.commit('setTargetFolder', this.content.id)
    },

    openThisDocument () {
      const targetPath = `/doc/${this.urlId}`
      if (this.$route.path !== targetPath) {
        this.$router.push({ name: 'Document', params: { id: this.urlId }})
      }
    }
  }
}
</script>
