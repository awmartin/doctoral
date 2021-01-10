<template>
  <div class="tags">
    <div class="tag" v-for="tag in tags" :key="tag">
      <tag-outline-icon />
      <div class="hashtag">{{ tag }}</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tags {
  // padding: 10px;
}
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
  }
}
</script>
