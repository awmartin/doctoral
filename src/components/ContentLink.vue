<template>
  <div :class="contentClass">
    <a @click="handleClick">
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
  cursor: pointer;
}
.Folder {
  font-weight: 500;
}

.block {
  a {
    padding: 6px 8px 6px 10px;
  }
  &.normal a:hover {
    background-color: lighten(lightskyblue, 10%);
  }
  &.normal a:active {
    background-color: lightskyblue;
  }

  &.disabled a {
    color: lightgray;
  }
  &.disabled a:hover {
    background-color: none !important;
  }
  &.disabled a:active {
    background-color: none !important;
  }

  &.selected a {
    background-color: lighten(lightskyblue, 20%);
  }
  &.selected a:hover {
    background-color: lighten(lightskyblue, 10%);
  }
}

.underline {
  a {
    padding: 1px 2px 1px 3px;
    margin: 5px 6px 5px 7px;
  }

  &.normal a:hover {
    border-bottom: 1px solid lighten(lightskyblue, 10%);
  }
  &.normal a:active {
    border-bottom: 1px solid lightskyblue;
  }

  &.disabled a {
    color: lightgray;
  }
  &.disabled a:hover {
    border-bottom: 1px solid transparent !important;
  }
  &.disabled a:active {
    border-bottom: 1px solid transparent !important;
  }

  &.selected a {
    border-bottom: 1px solid lighten(lightskyblue, 20%);
  }
  &.selected a:hover {
    border-bottom: 1px solid lighten(lightskyblue, 10%);
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
      default: null,
      type: Function
    },

    withClick: {
      default: null
    },

    disabled: {
      default: null,
      type: Function
    },

    options: {
      default: () => {
        return {
          highlightStyle: 'block' // also 'underline'
        }
      }
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
        return `content-link ${this.contentType} ${this.options.highlightStyle} disabled`
      } else if (this.routeId === this.content.key || this.routeId === this.content.id) {
        return `content-link ${this.contentType} ${this.options.highlightStyle} selected`
      } else {
        return `content-link ${this.contentType} ${this.options.highlightStyle} normal`
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
