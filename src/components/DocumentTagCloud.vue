<template>
  <div class="tags">
    <router-link class="tag" v-for="tag in tags" :key="tag" :to="{ name: 'Tag', params: { id: nohash(tag) } }">
      {{ tag }}
    </router-link>
  </div>
</template>

<style lang="scss" scoped>
.tags {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
}
.tag {
  margin: 0 6px 6px 0;
  font-size: 0.8rem;
  color: gray;
  height: 1.2rem;
  &:hover {
    text-decoration: underline;
  }
}
</style>

<script>
const _ = require('lodash')

export default {
  name: 'DocumentTagCloud',

  props: {
    content: {
      default: null,
      required: true
    }
  },

  components: {

  },

  data () {
    return {
      isPublishing: false
    }
  },

  computed: {
    tags () {
      return this.content?.tags
    }
  },

  methods: {
    nohash (tag) {
      return _.trimStart(tag, '#')
    }
  } // methods
}
</script>
