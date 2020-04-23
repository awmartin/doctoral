<template>
  <div class="breadcrumb">
    <content-link v-for="crumb in crumbs" :key="crumb.id" :content="crumb" class="crumb" :options="crumbOptions">
      <div class="arrow" v-if="crumb.id !== content.id">→</div>
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
}
.arrow {
  margin-top: 3px; // Push the arrow down to align with the content-links.
}
</style>

<script>
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
      home: {
        id: null,
        title: 'Home',
        type: 'Folder',
        parent: null
      },

      crumbOptions: {
        highlightStyle: 'underline'
      }
    }
  },

  computed: {
    ...mapGetters(['getContent']),

    crumbs () {
      const tr = [this.getContent(this.content.id)]

      let parent = this.getContent(this.content.parent)
      while (_.isObject(parent)) {
        tr.push(parent)
        parent = this.getContent(parent.parent)
      }

      tr.push(this.home)

      tr.reverse()
      return tr
    }
  }
}
</script>