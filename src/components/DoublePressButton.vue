<template>
  <button :class="buttonClass" @click="handleClick">
    <slot></slot>
  </button>
</template>

<style lang="scss" scoped>
.normal {
  background-color: lighten(lightcoral, 10%);
}
.normal:hover {
  background-color: lightcoral;
}
.normal:active {
  background-color: darken(lightcoral, 10%);
}

.ready {
  background-color: lighten(red, 20%) !important;
  color: white;
}
.ready:hover {
  background-color: red !important;
}
.ready:active {
  background-color: darken(red, 5%) !important;
}

.disabled {
  background-color: #eee !important;
  color: gray;
}
.disabled:hover {
  background-color: #eee !important;
}
.disabled:active {
  background-color: #eee !important;
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
    },

    disabled: {
      default: false,
      type: Boolean
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
      let tr = 'double-button'
      if (this.ready) {
        tr += ' ready'
      } else if (this.disabled) {
        tr += ' disabled'
      } else {
        tr += ' normal'
      }
      return tr
    }
  },

  methods: {
    handleClick () {
      if (this.disabled) { return }

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
