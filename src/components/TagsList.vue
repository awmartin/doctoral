<template>
  <div class="tags">
    <router-link :to="tagHref(tag[0])" class="tag" v-for="tag in tags" :key="tag[0]">
      <div class="left">
        <tag-outline-icon />
        <div class="hashtag">{{ tag[0] }}</div>
      </div>

      <div class="right">
        <span class="pill">{{ tag[1] }}</span>
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
      // const tags = {}
      // _.forEach(this.contents, content => {
      //   _.forEach(content.tags, tag => {
      //     if (_.has(tags, tag)) {
      //       tags[tag][1] += 1
      //     } else {
      //       tags[tag] = [tag, 1]
      //     }
      //   })
      // })

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
      // const tags = _.union(_.flatMap(this.contents, content => content.tags))
      // tags.sort()

      return sortedPairs
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
