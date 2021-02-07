<template>
  <div class="content-tree">
    <content-link :content="home" v-if="isHomeFolder" :click="handleClick(null)" :disabled="disabled" />
    <content-link v-for="child in children" :key="child.id" :content="child" class="indent" :click="handleClick(child)" :disabled="disabled">
      <content-tree :root="child" :click="click" :disabled="disabled" />
    </content-link>
  </div>
</template>

<style lang="scss" scoped>
.indent {
  margin-left: 15px;
}
</style>

<script>
import Content from '@/models/Content'
import ContentLink from '@/components/ContentLink'
import { mapGetters } from 'vuex'
const _ = require('lodash')

export default {
  name: 'ContentTree',

  props: {
    root: {
      default: null
    },

    click: {
      default: null
    },

    disabled: {
      default: null,
      type: Function
    }
  },

  components: {
    ContentLink
  },

  computed: {
    ...mapGetters(['getChildFolders']),

    home () {
      return Content.homeFolder
    },

    children () {
      const tr = this.getChildFolders(this.root)
      tr.sort((a, b) => _.toLower(a.title) > _.toLower(b.title) ? 1 : -1)
      return tr
    },

    isHomeFolder () {
      return Content.isHomeFolder(this.root)
    }
  },

  methods: {
    handleClick (x) {
      return () => {
        if (_.isFunction(this.click)) {
          this.click(x)
        }
      }
    }
  }
}
</script>
