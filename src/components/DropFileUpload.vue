<template>
  <div @drop.prevent="drop($event)" @dragover.prevent="dragOver" @dragleave.prevent="dragLeave" :class="dropperClass">
    <slot></slot>
  </div>
</template>

<style lang="scss" scoped>
.dropper {
  min-height: 100%;

  &.dropping {
    background-color: rgba(100, 100, 100, 0.1);
  }
}
</style>

<script>
import { mapGetters } from 'vuex'
const _ = require('lodash')

export default {
  name: 'DropFileUpload',

  data () {
    return {
      showDropSignal: false
    }
  },

  computed: {
    ...mapGetters(['sidebarTargetFolder']),

    dropperClass () {
      return this.showDropSignal ? 'dropper dropping' : 'dropper'
    }
  },

  methods: {
    drop (event) {
      let files = event.dataTransfer.files

      let file = files[0]

      let reader = new FileReader()
      reader.onload = f => {
        _.noop(f)

        this.$store.dispatch('createFile', {
          file,
          parent: this.sidebarTargetFolder
        })
        .then(content => {
          console.log('Successfully uploaded file:', content)
          this.showDropSignal = false
        })
        .catch(error => {
          console.error(error)
          this.showDropSignal = false
        })
      }

      reader.readAsDataURL(file)
    },

    dragOver () {
      this.showDropSignal = true
    },

    dragLeave () {
      this.showDropSignal = false
    }
  }
}
</script>
