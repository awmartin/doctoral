<template>
  <button :class="buttonClass" @click="handleClick">
    <slot></slot>
  </button>
</template>

<style lang="scss" scoped>
.double-button {
  &.normal {
    background-color: lighten(lightcoral, 10%);
  }
  &.normal:hover {
    background-color: lightcoral;
  }
  &.normal:active {
    background-color: darken(lightcoral, 10%);
  }

  &.ready {
    background-color: lighten(red, 20%) !important;
    color: white;
  }
  &.ready:hover {
    background-color: red !important;
  }
  &.ready:active {
    background-color: darken(red, 5%) !important;
  }
}
</style>

<script>
// This button must be clicked twice to fire the given action.

const _ = require('lodash')

export default {
  name: 'DoubleStateButton',

  props: {
    click: {
      default: null
    }
  },

  data () {
    return {
      ready: false,
      timer: false
    }
  },

  computed: {
    buttonClass () {
      if (this.ready) {
        return 'double-button ready'
      } else {
        return 'double-button normal'
      }
    }
  },

  methods: {
    handleClick () {
      if (!this.ready) {
        this.ready = true
        this.startTimer()
      } else {
        this.ready = false
        if (_.isFunction(this.click)) {
          this.click()
        }
      }
    },

    startTimer () {
      this.timer = setTimeout(this.cancel, 1500)
    },

    cancel () {
      this.ready = false
      this.timer = null
    }
  }
}
</script>
