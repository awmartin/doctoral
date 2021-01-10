<template>
  <div class="tags">
    <router-link :to="tagHref(tag)" class="tag" v-for="tag in tags" :key="tag">
      <tag-outline-icon />
      <div class="hashtag">{{ tag }}</div>
    </router-link>
  </div>
</template>

<style lang="scss" scoped>
.tag {
  display: flex;
  align-items: center;
  align-content: center;
  // justify-content: space-between;

  padding: 0 0 0 10px;
  height: 34px;
  cursor: pointer;
  &:hover {
    background-color: lightskyblue;
  }
  &:active {
    background-color: darken(lightskyblue, 10%);
  }
  .hashtag {
    margin-left: 4px;
  }
}
</style>

<script>
import { TagOutline as TagOutlineIcon } from 'mdue'
import { mapState } from 'vuex'
const _ = require('lodash')

export default {
  name: 'TagsList',

  components: {
    TagOutlineIcon
  },

  computed: {
    ...mapState(['contents']),

    tags () {
      const tags = _.union(_.flatMap(this.contents, content => content.tags))
      tags.sort()
      return tags
    }
  },

  methods: {
    tagHref (hashtag) {
      const tag = _.trimStart(hashtag, '#')
      return `/tag/${tag}`
    }
  }
}
</script>
