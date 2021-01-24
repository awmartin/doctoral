<template>
  <div class="trash">
    <h1>Trash</h1>

    <div class="contents">
      <h2>Click to restore…</h2>

      <content-link v-for="item in trashedContents" :content="item" :key="item.id" :click="restore(item)" :options="linkOptions">
        <div class="float">
          <span class="item-info">{{ itemInfo(item) }}</span>

          <button class="restore" @click="restore(item)()">
            <restore-icon />
          </button>

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
  // padding: 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
}
h1 {
  font-weight: lighter;
  margin-top: 0;
  margin-bottom: 0;
  padding: 10px;
}
.contents {
  padding: 10px;
  // width: 400px;
  width: calc(100%- 20px);
  overflow-y: scroll;
  // height: 100%;
  flex-grow: 2;
}
.content-link {
  width: 400px;
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

  button {
    padding: 3px;
    margin-left: 5px;
  }

  .delete-forever {
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
import DoublePressButton from '@/components/DoublePressButton'

import { DeleteForeverOutline as DeleteForeverOutlineIcon } from 'mdue'
import { Restore as RestoreIcon } from 'mdue'
import { mapGetters } from 'vuex'

const _ = require('lodash')

export default {
  name: 'Trash',

  components: {
    ContentLink,
    DeleteForeverOutlineIcon,
    RestoreIcon,
    DoublePressButton
  },

  data () {
    return {
      linkOptions: {
        includeHref: false
      }
    }
  },

  created () {
    this.$store.dispatch('registerTrashListener')
  },

  beforeUnmount () {
    this.$store.dispatch('deregisterTrashListener')
  },

  computed: {
    ...mapGetters(['getContent', 'trashedContents'])
  },

  methods: {
    restore (content) {
      return () => {
        const onSuccess = () => {
          console.debug(`Restored ${content.type}: ${content.title}`)
        }

        const onError = error => {
          console.error('Error occurred when restoring object:', error)
        }

        this.$store.dispatch('restore', {
          content,
          onSuccess,
          onError
        })
        return content
      }
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
      const contentTitle = content.title
      const contentType = content.type

      const onSuccess = () => {
        console.log(`Deleted ${contentType} ${contentTitle}`)
      }

      const onError = error => {
        console.error(`Error occurred when deleting ${contentType} ${contentTitle}:`, error)
      }

      return () => {
        this.$store.dispatch('delete', { content, onSuccess, onError })
      }
    }
  } // end methods
}
</script>
