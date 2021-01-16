<template>
  <button @click="toggle" :class="buttonClass">
    <slot />
  </button>
</template>

<style lang="scss" scoped>

</style>

<script>
export default {
  props: {
    field: {
      type: String,
      default: null
    },
    
    value: {
      type: String,
      default: null
    },

    action: {
      type: String,
      default: null
    }
  },

  computed: {
    buttonClass () {
      if (this.isSelected) {
        return 'toggle'
      } else {
        return 'toggle unselected'
      }
    },

    isSelected () {
      const stateValue = this.$store.state[this.field]
      return stateValue === this.value
    }
  },

  methods: {
    toggle() {
      this.$store.dispatch(this.action)
    }
  }
}
</script>
