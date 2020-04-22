<template>
  <div :class="contentClass">
    <a @click="handleClick" :class="linkClass" :href="href">
      <div class="left">
        <slot name="icon">
          <file-document-outline-icon v-if="isDocument" />
          <folder-outline-icon v-if="isFolder" />
        </slot>

        <span class="title">{{ title }}</span>
        <span class="folder">{{ folder }}</span>
      </div>

      <div class="right">
        <star-icon v-if="content.starred" class="star" />
      </div>
    </a>

    <slot></slot>
  </div>
</template>

<style lang="scss" scoped>
a {
  cursor: pointer;

  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  .material-design-icon {
    align-self: flex-start;
  }
  .left {
    display: flex;
  }
  .star {
    margin-left: 10px;
  }
}
.Folder {
  font-weight: 500;
}
.title {
  margin-left: 4px;
}

.block {
  a {
    padding: 6px 8px 6px 10px;
  }

  a.normal {
    color: #2c3e50;
  }
  a.normal:hover {
    background-color: lighten(lightskyblue, 10%);
  }
  a.normal:active {
    background-color: lightskyblue;
  }

  a.disabled {
    color: lightgray;
    cursor: not-allowed;
  }
  a.disabled:hover {
    background-color: none !important;
  }
  a.disabled:active {
    background-color: none !important;
  }

  a.selected {
    color: #2c3e50;
    background-color: lighten(lightskyblue, 20%);
  }
  a.selected:hover {
    background-color: lighten(lightskyblue, 10%);
  }
}

.underline {
  a {
    padding: 1px 2px 1px 3px;
    margin: 5px 6px 5px 7px;
  }

  a.normal {
    color: #2c3e50;
  }
  a.normal:hover {
    border-bottom: 1px solid lighten(lightskyblue, 10%);
  }
  a.normal:active {
    border-bottom: 1px solid lightskyblue;
  }

  a.disabled {
    color: lightgray;
  }
  a.disabled:hover {
    border-bottom: 1px solid transparent !important;
  }
  a.disabled:active {
    border-bottom: 1px solid transparent !important;
  }

  a.selected {
    color: #2c3e50;
    border-bottom: 1px solid lighten(lightskyblue, 20%);
  }
  a.selected:hover {
    border-bottom: 1px solid lighten(lightskyblue, 10%);
  }
}
</style>

<script>
import FileDocumentOutlineIcon from 'vue-material-design-icons/FileDocumentOutline'
import FolderOutlineIcon from 'vue-material-design-icons/FolderOutline'
import StarIcon from 'vue-material-design-icons/Star'

import util from '@/lib/util'
import { mapState, mapGetters } from 'vuex'
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
    },

    showFolder: {
      default: false,
      type: Boolean
    }
  },

  components: {
    FileDocumentOutlineIcon,
    FolderOutlineIcon,
    StarIcon
  },

  computed: {
    ...mapState(['filterTag']),
    ...mapGetters(['getContent']),

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

    linkClass () {
      if (this.isDisabled) {
        return 'disabled'
      } else if (this.routeId === this.content.key || this.routeId === this.content.id) {
        return 'selected'
      } else {
        return 'normal'
      }
    },

    contentClass () {
      return `content-link ${this.contentType} ${this.options.highlightStyle}`
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
    },

    isDisabled () {
      return _.isFunction(this.disabled) && this.disabled(this.content)
    },

    targetPath () {
      return `/doc/${this.urlId}`
    },

    href () {
      if (this.isFolder) {
        // We can't really navigate to a folder yet. Clicking just changes the state of the sidebar.
        // This prevents navigation weirdness.
        return null
      } else {
        return `/app#${this.targetPath}`
      }
    },

    folder () {
      const parentFolder = this.getContent(this.content.parent)
      if (_.isObject(parentFolder)) {
        return `(${parentFolder.title})`
      } else {
        return ''
      }
    }
  },

  methods: {
    handleClick () {
      if (this.isDisabled) { return }

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
      if (this.$route.path !== this.targetPath) {
        this.$router.push({ name: 'Document', params: { id: this.urlId }})
      }
    }
  }
}
</script>
