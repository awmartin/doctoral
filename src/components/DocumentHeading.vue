<template>
  <div :class="headingClass">
    <a @click="onClick">{{ heading.text }}</a>
  </div>
</template>

<style lang="scss" scoped>
.heading {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 6px;
  font-size: 0.9rem;
}
a {
  &:hover {
    text-decoration: underline;
    cursor: pointer;
  }
}
.h1 {
  font-weight: 700;
}
.h2 {
  font-weight: 500;
}
.h3 {
  font-weight: 400;
  text-indent: 10px;
}
.h4 {
  font-weight: 300;
  text-indent: 20px;
}
.h5 {
  font-weight: 300;
  text-indent: 30px;
}
.h6 {
  font-weight: 300;
  text-indent: 40px;
}
</style>

<script>
export default {
  name: 'DocumentHeading',

  props: ['heading', 'click'],

  computed: {
    headingClass () {
      return `heading ${this.heading.level}`
    }
  },

  methods: {
    onClick () {
      if (this.click) {
        this.click()
      }
    }
  }
}
</script>
