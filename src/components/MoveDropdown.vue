<template>
  <div :class="dropdownClass">
    <button @click="toggleMoveDocumentWindow" :disabled="disabled" :class="buttonClass" title="Move">
      <folder-move-icon />
    </button>

    <div class="dropdown" v-if="showMoveDocument">
      <div class="header">
        <span>Move {{target.title}} to…</span>

        <button @click="closeMoveDocumentWindow">
          <close-circle-outline-icon />
        </button>
      </div>

      <div class="scrollable">
        <content-tree :root="null" :click="moveTo" :disabled="disableIf" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.move-dropdown {
  position: relative;
  display: inline;

  &.right .dropdown {
    left: 0; 
  }
  &.left .dropdown {
    right: 0;
  }
}

.dropdown {
  position: absolute;
  z-index: 102;
  top: 40px;

  border: 2px solid lightskyblue;
  border-radius: 4px;
  background-color: white;
  width: 400px;
  height: 600px;


  .header {
    height: 30px;
    padding: 10px;
    border-bottom: 1px solid lighten(lightskyblue, 10%);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .scrollable {
    position: absolute;
    top: 50px;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 10px;
    overflow-y: scroll;
  }
}

button.disabled {
  background-color: #eee;
}
</style>

<script>
import ContentTree from '@/components/ContentTree'
import { FolderMove as FolderMoveIcon } from 'mdue'
import { CloseCircleOutline as CloseCircleOutlineIcon } from 'mdue'
import { mapGetters } from 'vuex'

const _ = require('lodash')

export default {
  name: 'MoveDropdown',

  components: {
    ContentTree,
    FolderMoveIcon,
    CloseCircleOutlineIcon
  },

  props: {
    target: {
      default: null, // content object
      type: Object
    },

    direction: {
      default: 'right',
      type: String
    },

    disabled: {
      default: false,
      type: Boolean
    }
  },

  data () {
    return {
      showMoveDocument: false,
    }
  },

  computed: {
    ...mapGetters(['getContent']),

    buttonClass () {
      if (_.isNil(this.target)) {
        return 'toggle disabled'
      } else {
        return 'toggle'
      }
    },

    dropdownClass () {
      return `move-dropdown ${this.direction}`
    },

    disableIf () {
      const foldersToExclude = new Set()
      if (this.target.isFolder) {
        this.gatherChildIds(this.target, foldersToExclude)
      }

      return target => {
        if (!_.isObject(target) || _.isNil(this.target)) { return true }

        // Folders can't be moved to children of themselves.
        const movingToChild = this.target.isFolder && foldersToExclude.has(target.id)

        // If we're moving a folder to a folder, don't drop it onto itself.
        const movingToSelf = (this.target.isFolder && target.isFolder) && this.target.id === target.id

        // No need to move a folder or a document into the same folder it's already in.
        const movingToSameParent = this.target.parent === target.id || (_.isNil(this.target.parent) && _.isNil(target.id))

        return movingToSelf || movingToSameParent || movingToChild
      }
    }
  },

  methods: {
    toggleMoveDocumentWindow () {
      if (_.isNil(this.target)) { return }

      this.showMoveDocument = !this.showMoveDocument
    },

    closeMoveDocumentWindow () {
      this.showMoveDocument = false
    },

    // Recursively gather all the IDs of the folder children of a given folder.
    gatherChildIds (folder, set) {
      if (!_.isObject(folder) || !folder.isFolder || !folder.canHaveChildren) { return }

      _.forEach(folder.children, childId => {
        const child = this.getContent(childId)
        if (child && child.isFolder) {
          set.add(child.id)
          this.gatherChildIds(child, set)
        }
      })
    },

    moveTo (destination) {
      if (_.isNil(this.target)) { return }

      const targetTitle = this.target.title
      const destinationTitle = destination ? destination.title : 'Home'

      const onSuccess = () => {
        console.log(`Moved ${targetTitle} to ${destinationTitle}.`)
        this.toggleMoveDocumentWindow()
        this.setSidebarToNewParentFolder(destination)
      }

      const onError = error => {
        console.error(`Encountered an error while moving ${targetTitle} to ${destinationTitle}:`, error)
      }

      this.$store.dispatch('moveContent', {
        contentToMove: this.target,
        destination,
        onSuccess,
        onError
      })
    },

    setSidebarToNewParentFolder (destination) {
      const folderId = _.isObject(destination) ? destination.id : null
      this.$store.dispatch('setSidebarFolderAndFocus', folderId)
    }
  } // methods
}
</script>
