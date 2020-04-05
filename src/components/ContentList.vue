<template>
  <div class="contents-list">
    <div class="header">
      <div class="location">
        <button @click="navigateToEnclosingFolder" :disabled="isRootFolder">
          <backspace-outline-icon />
        </button>

        <folder-outline-icon />

        <span class="folder-title" v-if="isRootFolder">Home</span>
        <input type="text" class="folder-title" v-model="folderTitle" v-else />
      </div>

      <div class="buttons">
        <button @click="createDocument">
          <plus-icon /><file-document-outline-icon />
        </button>

        <button @click="createFolder">
          <plus-icon /><folder-outline-icon />
        </button>
      </div>
    </div>

    <content-link v-for="content in folderContents"
      v-bind:key="content.id"
      v-bind:content="content">
    </content-link>
  </div>
</template>

<style lang="scss" scoped>
.header {
  padding: 10px;
}

.location {
  padding: 5px 0;
  font-size: 1.2rem;
}
.folder-title {
  margin-left: 4px;
}
input.folder-title {
  font-size: 1.2rem;
  border: none;
  outline: none;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.buttons {
  display: flex;
  flex-direction: row-reverse;
}
button {
  margin-right: 5px;
  &[disabled] {
    background-color: #eee;
  }
}
</style>

<script>
import { mapState } from 'vuex'
import ContentLink from '@/components/ContentLink'
import FileDocumentOutlineIcon from 'vue-material-design-icons/FileDocumentOutline'
import FolderOutlineIcon from 'vue-material-design-icons/FolderOutline'
import PlusIcon from 'vue-material-design-icons/Plus'
import BackspaceOutlineIcon from 'vue-material-design-icons/BackspaceOutline'

const fb = require('../firebase.js')
const _ = require('lodash')

export default {
  name: 'DocumentList',

  components: {
    FileDocumentOutlineIcon,
    PlusIcon,
    FolderOutlineIcon,
    BackspaceOutlineIcon,
    ContentLink
  },

  watch: {
    sidebarTarget () {
      if (!_.isNil(this.saveTimer)) {
        this.saveFolder()
      }
    }
  },

  data () {
    return {
      saveTimer: null
    }
  },

  computed: {
    ...mapState(['contents', 'currentUser', 'sidebarTarget']),

    targetFolder () {
      if (this.isRootFolder) {
        return null
      } else {
        const startKey = _.head(this.sidebarTarget)
        let folder = this.getContent(startKey)

        _.forEach(this.sidebarTarget, key => {
          if (_.isArray(folder.children) && _.has(folder.children, key)) {
            folder = folder.children[key]
          }
        })

        return folder
      }
    },

    isRootFolder () {
      return _.isNil(this.sidebarTarget)
    },

    folderTitle: {
      get () {
        if (this.isRootFolder) {
          return 'Home'
        } else {
          return this.targetFolder.title
        }
      },
      set (newTitle) {
        if (!this.isRootFolder) {
          this.targetFolder.title = newTitle
          this.updateFolderTitle()
        }
      }
    },

    folderContents () {
      if (_.isNil(this.targetFolder)) {
        const items =  _.filter(this.contents, content => _.isNil(content.parent))
        items.sort((a, b) => a.title > b.title ? 1 : -1)
        return items
      } else if (_.has(this.targetFolder, 'children')) {
        const childIds = this.targetFolder.children
        const items = _.filter(this.contents, content => _.includes(childIds, content.id))
        items.sort((a, b) => a.title > b.title ? 1 : -1)
        return items
      } else {
        return []
      }
    }
  },

  methods: {
    createFolder () {
      const newContent = {
        title: 'An Untitled Folder',
        type: 'Folder',
        children: []
      }

      if (_.isObject(this.targetFolder)) {
        newContent.parent = this.targetFolder.id
      }

      const contentsRef = fb.getCollection('contents')
      contentsRef.add(newContent).then(contentRef => {
        // Update the target folder by adding a new child.
        if (_.isObject(this.targetFolder)) {
          const targetFolderRef = fb.getCollection('contents').doc(this.targetFolder.id)

          if (_.isArray(this.targetFolder.children)) {
            this.targetFolder.children.push(contentRef.id)
          } else {
            this.targetFolder.children = [contentRef.id]
          }

          return targetFolderRef.update({
            children: this.targetFolder.children
          })
        } else {
          return null
        }
      }).then(() => {
        console.debug('Created folder')
      })
    },

    createDocument () {
      let newDocumentId = null

      const newDocument = {
        title: 'Untitled Document',
        content: ''
      }

      const documentsRef = fb.getCollection('documents')
      documentsRef.add(newDocument).then(docRef => {
        newDocumentId = docRef.id

        const newContent = {
          title: 'Untitled Document',
          key: newDocumentId,
          type: 'Document'
        }

        if (_.isObject(this.targetFolder)) {
          newContent.parent = this.targetFolder.id
        }

        const contentsRef = fb.getCollection('contents')
        return contentsRef.add(newContent)
      }).then(contentRef => {
        // Update the target folder by adding a new child.
        if (_.isObject(this.targetFolder)) {
          const targetFolderRef = fb.getCollection('contents').doc(this.targetFolder.id)

          if (_.isArray(this.targetFolder.children)) {
            this.targetFolder.children.push(contentRef.id)
          } else {
            this.targetFolder.children = [contentRef.id]
          }

          return targetFolderRef.update({
            children: this.targetFolder.children
          })
        } else {
          return null
        }
      }).then(() => {
        console.debug('Created document', newDocumentId)
        this.$router.push({ name: 'Document', params: { id: newDocumentId } })
      })
    },

    getContent (id) {
      return _.find(this.contents, content => content.id === id)
    },

    navigateToEnclosingFolder () {
      this.$store.commit('popTargetFolder')
    },

    updateFolderTitle () {
      if (_.isNil(this.saveTimer)) {
        this.saveTimer = setTimeout(this.saveFolder, 1000)
      } else {
        clearTimeout(this.saveTimer)
        this.saveTimer = setTimeout(this.saveFolder, 1000)
      }
    },

    cancelPendingSave () {
      if (!_.isNil(this.saveTimer)) {
        clearTimeout(this.saveTimer)
        this.saveTimer = null
      }
    },

    saveFolder () {
      this.cancelPendingSave()

      if (!this.isRootFolder) {
        const contentRef = fb.getCollection('contents').doc(this.targetFolder.id)
        contentRef.update({
          title: this.folderTitle
        }).then(() => {
          console.debug('Updated folder title')
        })
      }
    }
  }
}
</script>
