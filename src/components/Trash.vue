<template>
  <div class="trash">
    <h1>Trash</h1>

    <div class="contents">
      <p>Click to restore…</p>
      <content-link v-for="item in trashedItems" :content="item" :key="item.id" :click="restoreDocument(item)">
        <div class="float">{{ itemInfo(item) }}</div>
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
  max-width: 600px;
}
.float {
  position: absolute;
  right: 5px;
  top: calc(50% - 0.8em);
  font-size: 0.9em;
  color: lightskyblue;
}
.content-link {
  position: relative;
}
</style>

<script>
import ContentLink from '@/components/ContentLink'
import { mapState } from 'vuex'

const fb = require('@/firebase')
const _ = require('lodash')

export default {
  name: 'Trash',

  components: {
    ContentLink
  },

  data () {
    return {
      trashedItems: [],
      trashUnsubscriber: null
    }
  },

  created () {
    this.trashUnsubscriber = fb.getCollection('contents').where('trashed', '==', true).onSnapshot(snapshot => {
      const items = []
      snapshot.forEach(doc => {
        items.push({ ...doc.data(), id: doc.id })
      })
      this.trashedItems = items
    })
  },

  beforeDestroy () {
    if (_.isFunction(this.trashUnsubscriber)) {
      this.trashUnsubscriber()
    }
  },

  computed: {
    ...mapState(['contents'])
  },

  methods: {
    restoreDocument (content) {
      return () => {
        if (_.isNil(content)) { return }
        if (_.isObject(content) && _.isNil(content.id)) { return }

        const batch = fb.db.batch()

        const restoreData = {
          trashed: false
        }

        // Check to see if the parent doesn't exist or is also trashed.
        // If not, then restore to the home folder.
        if (_.isString(content.parent)) {
          const parent = this.getContent(content.parent)
          const trashedParent = this.getTrashedItem(content.parent)

          if (_.isObject(trashedParent) || _.isNil(parent)) {
            // Parent is trashed or doesn't exist.
            restoreData.parent = null
          }
          if (_.isObject(trashedParent)) {
            // The parent is still around, even though we're restoring a child of it.
            // Let's remove the to-be-restored child from the parent's children.
            const parentRef = fb.getCollection('contents').doc(content.parent)
            const newParentChildren = _.without(trashedParent.children, content.id)
            batch.update(parentRef, {
              children: newParentChildren
            })
          }
        }

        const contentRef = fb.getCollection('contents').doc(content.id)
        batch.update(contentRef, restoreData)

        batch.commit().then(() => {
          console.debug(`Restored ${content.type} ${content.title}`)
        })
      }
    },

    getContent (id) {
      return _.find(this.contents, content => content.id === id)
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
          tr += `Included in ${parent.title}`
        }
      } else {
        tr += 'Included in home folder'
      }
      return tr
    },

    documentInfo (content) {
      let tr = ''
      if (_.isString(content.parent)) {
        const parent = this.getParent(content)
        if (_.isObject(parent)) {
          tr += `Included in ${parent.title}`
        }
      } else {
        tr += 'Included in home folder'
      }
      return tr
    },

    getParent (content) {
      if (_.isNil(content) || _.isNil(content.parent)) {
        return null
      }

      const parent = this.getContent(content.parent)
      return parent
    }
  }
}
</script>