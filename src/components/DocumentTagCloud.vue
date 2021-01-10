<template>
  <div class="tags">
    <div class="tag" v-for="tag in tags" :key="tag">
      {{ tag }}
    </div>
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
}
</style>

<script>
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

  } // methods
}
</script>
