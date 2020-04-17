<template>
  <div class="folder-bar">
    <button @click="starFolder" :class="starFolderClass" :disabled="isRootFolder">
      <folder-star-icon v-if="isStarred" />
      <folder-star-outline-icon v-else />
    </button>

    <move-dropdown :content="targetFolder" />
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

import { mapState } from 'vuex'
const _ = require('lodash')
const fb = require('../firebase.js')

export default {
  name: 'FolderBar',

  computed: {
    ...mapState(['contents', 'sidebarTarget']),

    starFolderClass () {
      let tr = 'star-folder toggle '
      if (this.isRootFolder) {
        tr += 'disabled'
      } else if (this.targetFolder.starred) {
        tr += 'selected'
      } else {
        tr += 'unselected'
      }
      return tr
    },

    isRootFolder () {
      return _.isNil(this.sidebarTarget)
    },

    targetFolder () {
      if (this.isRootFolder) {
        return null
      } else {
        return _.find(this.contents, item => item.id === this.sidebarTarget)
      }
    },

    isStarred () {
      if (this.isRootFolder) { return false }
      return !!this.targetFolder.starred
    }
  },

  components: {
    MoveDropdown,
    FolderStarOutlineIcon,
    FolderStarIcon
  },

  methods: {
    starFolder () {
      if (this.isRootFolder) { return }
      if (_.isNil(this.targetFolder)) { return }

      const folderTitle = this.targetFolder.title
      const contentRef = fb.getCollection('contents').doc(this.sidebarTarget)
      contentRef.update({
        starred: !this.targetFolder.starred,
        updated: new Date()
      }).then(() => {
        console.debug('Starred a folder:', folderTitle)
      })
    }
  }
}
</script>
