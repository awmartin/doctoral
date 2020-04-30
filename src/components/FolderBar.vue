<template>
  <div class="folder-bar">
    <button @click="toggleStarFolder" :class="starFolderButtonClass" :disabled="isHomeFolder || isStarredFolder">
      <folder-star-icon v-if="isStarred" />
      <folder-star-outline-icon v-else />
    </button>

    <move-dropdown :target="folder" :disabled="isHomeFolder || isStarredFolder" />
  </div>
</template>

<style lang="scss" scoped>
button {
  margin-right: 5px;
}
</style>

<script>
import FolderStarOutlineIcon from 'vue-material-design-icons/FolderStarOutline'
import FolderStarIcon from 'vue-material-design-icons/FolderStar'
import MoveDropdown from '@/components/MoveDropdown'

const _ = require('lodash')

export default {
  name: 'FolderBar',

  props: {
    folder: {
      default: null,
      type: Object
    }
  },

  computed: {
    starFolderButtonClass () {
      let tr = 'star-folder toggle '

      if (this.isHomeFolder) {
        tr += 'disabled'
      } else if (_.isObject(this.folder) && this.folder.starred) {
        tr += 'selected'
      } else {
        tr += 'unselected'
      }

      return tr
    },

    isHomeFolder () {
      return this.folder.isHomeFolder()
    },

    isStarredFolder () {
      return this.folder.isStarredFolder()
    },

    isStarred () {
      if (this.isHomeFolder || this.isStarredFolder) { return false }
      return !!this.folder.starred
    }
  },

  components: {
    MoveDropdown,
    FolderStarOutlineIcon,
    FolderStarIcon
  },

  methods: {
    toggleStarFolder () {
      if (this.isHomeFolder || _.isNil(this.folder)) { return }

      const folderTitle = this.folder.title
      const onSuccess =() => {
        console.log('Starred a folder:', folderTitle)
      }

      const onError = error => {
        console.error('Encountered an error while attempting to star a folder:', error)
      }

      this.$store.dispatch('toggleStar', {
        content: this.folder,
        onSuccess,
        onError
      })
    }
  }
}
</script>
