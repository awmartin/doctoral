<template>
  <div class="tags">
    <router-link :to="{ name: 'Tag', params: { id: toTag(hashtag[0]) } }" :class="hashtagClass(hashtag[0])" v-for="hashtag in tags" :key="hashtag[0]">
      <div class="left">
        <tag-outline-icon />
        <div class="hashtag">{{ hashtag[0] }}</div>
      </div>

      <div class="right">
        <span class="pill">{{ hashtag[1] }}</span>
      </div>
    </router-link>
  </div>
</template>

<style lang="scss" scoped>
.tag {
  display: flex;
  align-items: center;
  align-content: center;
  justify-content: space-between;

  padding: 0 0 0 10px;
  height: 34px;
  cursor: pointer;

  &.selected {
    background-color: lighten(lightskyblue, 10%);
  }
  &:hover {
    background-color: lightskyblue;
  }
  &:active {
    background-color: darken(lightskyblue, 10%);
  }
  .hashtag {
    margin-left: 4px;
  }
  .pill {
    background-color: #eee;
    display: inline-block;
    padding: 1px 5px;
    border-radius: 4px;
    margin-right: 10px;
    font-size: 0.8rem;
  }
  .left {
    display: flex;
    width: 100%;
  }
  .right {
    display: flex;
    align-items: center;
    min-height: 22px;
    height: 100%;
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
      const tags = {}
      _.forEach(this.contents, content => {
        _.forEach(content.tags, tag => {
          if (_.has(tags, tag)) {
            tags[tag] += 1
          } else {
            tags[tag] = 1
          }
        })
      })

      const sortedPairs = _.toPairs(tags).sort((a, b) => a[0] < b[0] ? -1 : 1)
      return sortedPairs
    }
  },

  methods: {
    toTag (hashtag) {
      return _.trimStart(hashtag, '#')
    },

    hashtagClass (tag) {
      let klass = 'tag'
      if (this.$route.name === 'Tag' && ('#' + this.$route.params.id) === tag) {
        klass += ' selected'
      }
      return klass
    }
  }
}
</script>
