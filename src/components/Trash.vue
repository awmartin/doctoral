<template>
  <div class="trash">
    <h1>Trash</h1>

    <div class="contents">
      <p>Click to restore…</p>
      <content-link v-for="item in trashedItems" :content="item" :key="item.id" :click="restoreDocument(item)">
        <div class="float">
          <span class="item-info">{{ itemInfo(item) }}</span>
          <double-press-button class="delete-forever" :click="deleteForever(item)">
            <delete-forever-outline-icon />
          </double-press-button>
        </div>
      </content-link>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.trash {
  padding: 10px;
}
h1 {
  font-weight: lighter;
  margin-top: 0;
}
.contents {
  max-width: 400px;
}
.float {
  position: absolute;
  left: calc(100% + 5px);
  top: 3px;
  width: 100%;

  display: flex;
  align-items: center;

  .item-info {
    font-size: 0.9em;
    color: #2c3e50;
    width: 80%;
  }
  .delete-forever {
    padding: 3px;
    margin-right: 5px;
    background-color: lighten(lightcoral, 10%);
    &:hover {
      background-color: lightcoral;
    }
    &:active {
      background-color: darken(lightcoral, 10%);
    }
  }
}
.content-link {
  position: relative;
}
</style>

<script>
import ContentLink from '@/components/ContentLink'
import DeleteForeverOutlineIcon from 'vue-material-design-icons/DeleteForeverOutline'
import DoublePressButton from '@/components/DoublePressButton'
import { mapGetters } from 'vuex'

const _ = require('lodash')

export default {
  name: 'Trash',

  components: {
    ContentLink,
    DeleteForeverOutlineIcon,
    DoublePressButton
  },

  data () {
    return {
      trashedItems: [],
      trashUnsubscriber: null
    }
  },

  created () {
    const onSuccess = trashUnsubscriber => {
      this.trashUnsubscriber = trashUnsubscriber
    }

    const onError = error => {
      console.debug('Error occurred when subscribing to the trash:', error)
    }

    this.$store.dispatch('registerTrashListener', {
      onSuccess,
      onError
    })
  },

  beforeDestroy () {
    if (_.isFunction(this.trashUnsubscriber)) {
      this.trashUnsubscriber()
    }
  },

  computed: {
    ...mapGetters(['getContent'])
  },

  methods: {
    restoreDocument (content) {
      return () => {
        return content
        // if (_.isNil(content)) { return }
        // if (_.isObject(content) && _.isNil(content.id)) { return }

        // const batch = fb.db.batch()

        // const now = new Date()
        // const restoreData = {
        //   trashed: false,
        //   updated: now
        // }

        // // Check to see if the parent doesn't exist or is also trashed.
        // // If not, then restore to the home folder.
        // if (_.isString(content.parent)) {
        //   const parent = this.getContent(content.parent)
        //   const trashedParent = this.getTrashedItem(content.parent)

        //   if (_.isObject(trashedParent) || _.isNil(parent)) {
        //     // Parent is trashed or doesn't exist.
        //     restoreData.parent = null
        //   }
        //   if (_.isObject(trashedParent)) {
        //     // The parent is still around, even though we're restoring a child of it.
        //     // Let's remove the to-be-restored child from the parent's children.
        //     const parentRef = fb.getCollection('contents').doc(content.parent)
        //     const newParentChildren = _.without(trashedParent.children, content.id)
        //     batch.update(parentRef, {
        //       children: newParentChildren,
        //       updated: now
        //     })
        //   }
        // }

        // const contentRef = fb.getCollection('contents').doc(content.id)
        // batch.update(contentRef, restoreData)

        // batch.commit().then(() => {
        //   console.debug(`Restored ${content.type} ${content.title}`)
        // })
      }
    },

    getTrashedItem (id) {
      return _.find(this.trashedItems, item => item.id === id)
    },

    itemInfo (content) {
      if (content.type === 'Folder') {
        return this.folderInfo(content)
      } else if (content.type === 'Document') {
        return this.documentInfo(content)
      } else {
        return ''
      }
    },

    folderInfo (content) {
      let tr = ''

      if (_.isString(content.parent)) {
        const parent = this.getParent(content)
        if (_.isObject(parent)) {
          tr += `… in ${parent.title}`
        }
      } else {
        tr += '… in Home folder'
      }

      const contentsCount = this.getFolderContentsCount(content)
      tr += ` (${contentsCount} contained items)`

      return tr
    },

    getFolderContentsCount (folder) {
      if (folder.type !== 'Folder') { return 0 }

      let tr = 0

      _.forEach(folder.children, childId => {
        const child = this.getContent(childId)
        if (_.isObject(child) && child.type === 'Folder') {
          tr += 1 // For the child folder itself.
          tr += this.getFolderContentsCount(child)
        } else if (_.isObject(child) && child.type === 'Document') {
          tr += 1
        }
      })

      return tr
    },

    documentInfo (content) {
      if (!_.isObject(content)) { return '' }

      let tr = ''
      if (_.isString(content.parent)) {
        const parent = this.getParent(content)
        if (_.isObject(parent)) {
          tr += `… in ${parent.title}`
        }
      } else {
        tr += '… in Home folder'
      }
      return tr
    },

    getParent (content) {
      if (!_.isObject(content)) { return null }
      if (!_.isString(content.parent)) { return null }

      const parent = this.getContent(content.parent)
      return parent
    },

    deleteForever (content) {
      return () => {
        return content
        // console.debug('Deleting forever', content.type, content.title)
        // if (content.type === 'Document') {
        //     this.deleteDocument(content)
        // } else if (content.type === 'Folder') {
        //     this.deleteFolder(content)
        // }
      }
    },

    deleteDocument (content) {
      return content
      // const batch = fb.db.batch()

      // // Remove the document's content id from the children field of the containing folder.
      // if (!_.isNil(content.parent)) {
      //   const parentContent = this.getContent(content.parent) || this.getTrashedItem(content.parent)
      //   if (!_.isNil(parentContent)) {
      //     const parentRef = fb.getCollection('contents').doc(content.parent)

      //     _.pull(parentContent.children, content.id)

      //     batch.update(parentRef, {
      //       children: parentContent.children,
      //       updated: new Date()
      //     })
      //   }
      // }

      // this.deleteDocument_(batch, content)

      // const documentTitle = content.title
      // batch.commit().then(() => {
      //   console.debug('Deleted document', documentTitle)
      // })
    },

    deleteDocument_ (batch, content) {
      return _.noop(batch, content)
      // console.debug(`  Queueing ${content.type} ${content.title} for deletion.`)

      // // Delete the content object.
      // const contentRef = fb.getCollection('contents').doc(content.id)
      // batch.delete(contentRef)

      // // Delete the document itself.
      // const documentId = content.key
      // const documentRef = fb.getCollection('documents').doc(documentId)
      // batch.delete(documentRef)
    },

    deleteFolder (content) {
      return _.noop(content)
      // const batch = fb.db.batch()

      // // Remove the folders's content id from the 'children' field of the containing folder.
      // if (!_.isNil(content.parent)) {
      //   const parentContent = this.getContent(content.parent) || this.getTrashedItem(content.parent)
      //   if (!_.isNil(parentContent)) {
      //     const parentRef = fb.getCollection('contents').doc(content.parent)

      //     _.pull(parentContent.children, content.id)

      //     batch.update(parentRef, {
      //       children: parentContent.children,
      //       updated: new Date()
      //     })
      //   }
      // }

      // this.deleteFolder_(batch, content)

      // const folderTitle = content.title
      // batch.commit().then(() => {
      //   console.debug('Deleted folder', folderTitle)
      // })
    },

    deleteFolder_ (batch, content) {
      return _.noop(batch, content)
      // console.debug(`  Queueing ${content.type} ${content.title} for deletion.`)

      // // Delete the children, recursively.
      // _.forEach(content.children, childId => {
      //   const child = this.getContent(childId) || this.getTrashedItem(childId)
      //   if (!_.isNil(child)) {
      //     if (child.type === 'Document') {
      //       this.deleteDocument_(batch, child)
      //     } else if (child.type === 'Folder') {
      //       this.deleteFolder_(batch, child)
      //     }
      //   }
      // })

      // // Delete the folder's content object.
      // const contentRef = fb.getCollection('contents').doc(content.id)
      // batch.delete(contentRef)
    }
  } // methods
}
</script>
