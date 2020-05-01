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
import { mapState, mapGetters } from 'vuex'
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
    ...mapState(['contents']),
    ...mapGetters(['homeChildren', 'getChildFolders']),

    home () {
      return Content.homeFolder
    },

    children () {
      // let tr = []

      // if (this.isHomeFolder) {
      //   tr = _.filter(this.homeChildren, content => content.isFolder())
      // } else if (!_.isEmpty(this.root.children)) {
      //   // const getContent = id => _.find(this.contents, content => {
      //   //   return content.id === id && content.isFolder()
      //   // })
      //   // tr = _.filter(_.map(this.root.children, key => getContent(key)))
      //   tr = this.getChildFolders(this.root)
      // }

      return this.getChildFolders(this.root)
    },

    isHomeFolder () {
      return _.isNil(this.root)
    }
  },

  methods: {
    hasChildren (content) {
      return _.isNil(content) || (_.isObject(content) && !_.has(content, 'children')) || !_.isEmpty(content.children)
    },

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
