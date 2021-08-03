<template>
  <div @drop.prevent="drop($event)" @dragover.prevent="dragOver" @dragleave.prevent="dragLeave" :class="dropperClass">
    <slot></slot>
    <div class="signal" v-if="showDropSignal">
      <div class="message">
        Drop file to upload.
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dropper {
  position: relative;
  min-height: 100%;

  &.hover {
    background-color: rgba(100, 100, 100, 0.1);
  }
}
</style>

<script>
const _ = require('lodash')

export default {
  name: 'DropFileUpload',

  data () {
    return {
      showDropSignal: false
    }
  },

  computed: {
    dropperClass () {
      return this.showDropSignal ? 'dropper hover' : 'dropper'
    }
  },

  methods: {
    drop (e) {
      let files = e.dataTransfer.files

      let file = files[0]

      let reader = new FileReader()
      reader.onload = f => {
        _.noop(f)

        this.$store.dispatch('uploadFileForDocument', {
          file,
          document: { id: 'files' }
        })
        .then(url => {
          _.noop(url)
          // TODO Create a File object with the url and filename.
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
