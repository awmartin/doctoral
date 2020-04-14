<template>
  <div class="move-dropdown">
    <button @click="toggleMoveDocumentWindow" :disabled="disableButtonIfHome" :class="buttonClass">
      <folder-move-icon />
    </button>

    <div class="dropdown" v-if="showMoveDocument">
      <div class="header">
        <span>Move {{content.title}} to…</span>

        <button @click="closeMoveDocumentWindow">
          <close-circle-outline-icon />
        </button>
      </div>

      <div class="scrollable">
        <content-tree :root="null" :click="moveTo" :disabled="disableIf"></content-tree>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.move-dropdown {
  position: relative;
  display: inline;
}
.dropdown {
  position: absolute;
  z-index: 102;
  top: 40px;
  left: 0;

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
import FolderMoveIcon from 'vue-material-design-icons/FolderMove'
import CloseCircleOutlineIcon from 'vue-material-design-icons/CloseCircleOutline'
import { mapState } from 'vuex'

const fb = require('../firebase.js')
const _ = require('lodash')

export default {
  name: 'MoveDropdown',

  components: {
    ContentTree,
    FolderMoveIcon,
    CloseCircleOutlineIcon
  },

  props: {
    content: {
      default: null
    }
  },

  data () {
    return {
      showMoveDocument: false,
    }
  },

  computed: {
    ...mapState(['contents']),

    disableButtonIfHome () {
      return _.isNil(this.content)
    },

    buttonClass () {
      if (_.isNil(this.content)) {
        return 'toggle disabled'
      } else {
        return 'toggle'
      }
    }
  },

  methods: {
    toggleMoveDocumentWindow () {
      if (_.isNil(this.content)) { return }

      this.showMoveDocument = !this.showMoveDocument
    },

    closeMoveDocumentWindow () {
      this.showMoveDocument = false
    },

    getContent (id) {
      return _.find(this.contents, content => content.id === id)
    },

    gatherChildIds (folder) {
      if (!_.isObject(folder)) { return [] }
      if (folder.type !== 'Folder') { return [] }
      if (!_.isArray(folder.children)) { return [] }

      let tr = []

      _.forEach(folder.children, childId => {
        const child = this.getContent(childId)
        if (child.type === 'Folder') {
          tr.push(childId)
          const childIds = this.gatherChildIds(child)
          tr = _.concat(tr, childIds)
        }
      })

      return tr
    },

    moveTo (target) {
      if (_.isNil(this.content)) { return }

      const now = new Date()
      const batch = fb.db.batch()

      // Remove the content key from the children of the original parent.
      if (_.isString(this.content.parent)) {
        const parentRef = fb.getCollection('contents').doc(this.content.parent)
        const parent = this.getContent(this.content.parent)

        _.pull(parent.children, this.content.id)

        batch.update(parentRef, {
          children: parent.children,
          updated: now
        })
      }

      // Change the parent of the doc's content.
      const contentRef = fb.getCollection('contents').doc(this.content.id)
      batch.update(contentRef, {
        parent: _.isNil(target) ? null : target.id,
        updated: now
      })

      // Add the key to the new parent's children.
      if (_.isObject(target)) {
        const targetRef = fb.getCollection('contents').doc(target.id)
        target.children.push(this.content.id)
        batch.update(targetRef, {
          children: target.children,
          updated: now
        })
      }

      batch.commit().then(() => {
        console.debug(`Moved ${this.content.title} to ${target ? target.title : 'Home'}`)
      }).finally(() => {
        this.toggleMoveDocumentWindow()
      })
    },

    disableIf (target) {
      if (!_.isObject(target)) { return true }

      let movingToChild = false
      if (this.content.type === 'Folder') {
        const childIds = this.gatherChildIds(this.content)
        movingToChild = _.includes(childIds, target.id)
      }

      // If we're moving a folder to a folder, don't drop it onto itself.
      const movingToSelf = (this.content.type === 'Folder' && target.type === 'Folder') && this.content.id === target.id

      // No need to move a folder or a document into the same folder it's already in.
      const movingToSameParent = this.content.parent === target.id || (_.isNil(this.content.parent) && _.isNil(target.id))

      return movingToSelf || movingToSameParent || movingToChild
    }
  } // methods
}
</script>
