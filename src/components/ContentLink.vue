<template>
  <div :class="contentClass">
    <a @click="handleClick" :class="linkClass">
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
      const targetPath = `/doc/${this.urlId}`
      if (this.$route.path !== targetPath) {
        this.$router.push({ name: 'Document', params: { id: this.urlId }})
      }
    }
  }
}
</script>
