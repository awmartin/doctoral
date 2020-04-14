<template>
  <div class="content-tree">
    <content-link :content="home" v-if="isRoot" :click="handleClick(null)" :disabled="disabled" />
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
import ContentLink from '@/components/ContentLink'
import { mapState } from 'vuex'
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

  data () {
    return {
      home: {
        id: null,
        title: 'Home',
        type: 'Folder'
      }
    }
  },

  computed: {
    ...mapState(['contents']),

    children () {
      let tr = []

      if (_.isNil(this.root)) {
        tr = _.filter(this.contents, content => _.isNil(content.parent) && content.type === 'Folder')
      } else if (!_.isEmpty(this.root.children)) {
        const getContent = id => _.find(this.contents, content => {
          return content.id === id && content.type === 'Folder'
        })
        tr = _.filter(_.map(this.root.children, key => getContent(key)))
      }

      return tr
    },

    isRoot () {
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
