<template>
  <div class="breadcrumb">
    <content-link v-for="crumb in crumbs" :key="crumb.id" :content="crumb" class="crumb" :options="crumbOptions">
      <div class="arrow" v-if="crumb.id !== contentId">→</div>
    </content-link>
  </div>
</template>

<style lang="scss" scoped>
.breadcrumb {
  display: flex;
  align-items: center;
}
.crumb {
  display: flex;
  align-items: center;
}
</style>

<script>
import Content from '@/models/Content'
import ContentLink from '@/components/ContentLink'
import { mapGetters } from 'vuex'
const _ = require('lodash')

export default {
  name: 'Breadcrumb',

  props: ['content'],

  components: {
    ContentLink
  },

  data () {
    return {
      crumbOptions: {
        highlightStyle: 'underline'
      }
    }
  },

  computed: {
    ...mapGetters(['getContent']),

    contentId () {
      return _.isObject(this.content) ? this.content.id : -1
    },

    crumbs () {
      if (_.isNil(this.content)) { return [] }

      // We don't need to look up tags in the table of contents.
      let target
      if (this.content.isTag || this.content.archived) {
        target = this.content
      } else if (this.content.isDocument) {
        target = this.getContent(this.content.id)
      }

      if (_.isNil(target)) { return [] }

      const tr = [target]

      let parent = this.getContent(target.parent)
      while (_.isObject(parent)) {
        tr.push(parent)
        if (parent.id === 'ARCHIVEFOLDER') {
          break
        }
        parent = this.getContent(parent.parent)
      }

      // TODO Start representing the home folder as Content.homeFolder.
      if (Content.isHomeFolder(parent)) {
        tr.push(Content.homeFolder)
      }

      tr.reverse()
      return tr
    }
  }
}
</script>
