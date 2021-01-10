<template>
  <div class="tag-detail">
    <Sidebar />

    <div class="body">
      <div class="header">
        <breadcrumb :content="tagContent" />
      </div>

      <h1>Documents with {{ hashtag }}</h1>
      <content-link v-for="content in contentsWithTag" :key="content.id" v-bind:content="content" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tag-detail {
  position: relative;
  display: flex;
  height: calc(100% - 36px);
}
.body {
  height: 100%;
  width: 82%;
}
.header {
  height: 32px;
  padding: 10px 0;

  display: flex;
  justify-content: space-between;
  align-items: center;
}
h1 {
  font-weight: 300;
  margin-left: 10px;
}
</style>

<script>
import Sidebar from '@/components/Sidebar'
import ContentLink from '@/components/ContentLink'
import Breadcrumb from '@/components/Breadcrumb'
import Content from '@/models/Content'

import { mapState, mapGetters } from 'vuex'
const _ = require('lodash')

export default {
  name: 'Tag',

  components: {
    Sidebar,
    ContentLink,
    Breadcrumb
  },

  computed: {
    ...mapState(['contents']),
    ...mapGetters(['isLoggedIn']),

    hashtag () {
      return '#' + this.$route.params.id
    },

    contentsWithTag () {
      return _.filter(this.contents, content => _.includes(content.tags, this.hashtag))
    },

    tagContent () {
      return new Content.Content(this.hashtag, 'Tag', false, false, this.hashtag, this.hashtag, 'TAGSLIST')
    }
  }
}
</script>
