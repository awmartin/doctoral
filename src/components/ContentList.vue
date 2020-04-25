<template>
  <div class="contents-list">
    <div class="header">
      <div class="location">
        <button @click="navigateToEnclosingFolder" :disabled="isRootFolder || isStarredFolder">
          <backspace-outline-icon />
        </button>

        <span class="folder-title" v-if="isRootFolder">Home</span>
        <span class="folder-title" v-if="isStarredFolder">Starred</span>
        <input type="text" class="folder-title" v-model="folderTitle" v-if="!isRootFolder && !isStarredFolder" />
      </div>

      <div class="buttons actions">
        <search-dropdown />

        <button @click="createDocument">
          +<file-document-outline-icon />
        </button>

        <button @click="createFolder">
          +<folder-outline-icon />
        </button>
      </div>

      <div class="buttons operations">
        <filter-bar />
        <folder-bar />
      </div>
    </div>

    <div class="scrollable">
      <content-link v-for="content in folderContents"
        v-bind:key="content.id"
        v-bind:content="content">
      </content-link>
    </div>

    <div class="footer">
      <div class="left">
        <double-press-button :click="trashFolder" v-if="!isRootFolder && !isStarredFolder">
          <delete-outline-icon />
        </double-press-button>
      </div>

      <div class="right">
        <sort-bar />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.contents-list {
  position: relative;
  height: 100%;
}
.header {
  padding: 5px 10px 10px 10px;
}
.scrollable {
  height: calc(100% - 155px);
  overflow-y: scroll;
}
.footer {
  position: absolute;
  padding: 10px;
  bottom: 0px;
  width: calc(100% - 20px);
  display: flex;
  justify-content: space-between;
}

.location {
  display: flex;
  align-items: center;
  padding: 5px 0;
  font-size: 1.2rem;
  margin-bottom: 5px;
}
.folder-title {
  margin-left: 3px;
}
input.folder-title {
  font-size: 1.2rem;
  border: none;
  outline: none;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  flex-grow: 2;
  border-bottom: 1px solid lighten(lightskyblue, 20%);
  width: calc(100% - 25px);
}

.buttons {
  display: flex;
  margin-bottom: 5px;
  width: 100%;
  align-items: center;

  button {
    margin-right: 0;
    margin-left: 5px;
  }

  &.operations {
    justify-content: space-between;
  }
}

.left {
  display: flex;
  justify-content: flex-start;
}
.right {
  display: flex;
  justify-content: flex-end;
}
</style>

<script>
import { mapState, mapGetters } from 'vuex'

import ContentLink from '@/components/ContentLink'
import SearchDropdown from '@/components/SearchDropdown'
import DoublePressButton from '@/components/DoublePressButton'
import SortBar from '@/components/SortBar'
import FilterBar from '@/components/FilterBar'
import FolderBar from '@/components/FolderBar'
import util from '@/lib/util'

import FileDocumentOutlineIcon from 'vue-material-design-icons/FileDocumentOutline'
import FolderOutlineIcon from 'vue-material-design-icons/FolderOutline'
import BackspaceOutlineIcon from 'vue-material-design-icons/BackspaceOutline'
import DeleteOutlineIcon from 'vue-material-design-icons/DeleteOutline'

const fb = require('../firebase.js')
const _ = require('lodash')

export default {
  name: 'ContentList',

  components: {
    FileDocumentOutlineIcon,
    FolderOutlineIcon,
    BackspaceOutlineIcon,
    ContentLink,
    DoublePressButton,
    DeleteOutlineIcon,
    SearchDropdown,
    SortBar,
    FilterBar,
    FolderBar
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
    ...mapState(['contents', 'currentUser', 'sidebarTarget', 'sortDirection', 'sortGrouping', 'sortField', 'filterTag']),
    ...mapGetters(['getContent']),

    targetFolder () {
      if (this.isRootFolder) {
        return null
      } else {
        return _.find(this.contents, item => item.id === this.sidebarTarget)
      }
    },

    isRootFolder () {
      return _.isNil(this.sidebarTarget) && this.filterTag !== 'starred'
    },

    isStarredFolder () {
      return this.filterTag === 'starred'
    },

    folderTitle: {
      get () {
        if (this.isRootFolder) {
          return 'Home'
        } else if (_.isObject(this.targetFolder)) {
          return this.targetFolder.title
        } else {
          return ''
        }
      },
      set (newTitle) {
        if (!this.isRootFolder) {
          this.targetFolder.title = newTitle
          this.updateFolderTitle()
        }
      }
    },

    unsortedFolderContents () {
      if (this.filterTag === 'starred') {
        return _.filter(this.contents, item => item.starred)
      }

      const isHome = _.isNil(this.targetFolder)
      if (isHome) {
        return _.filter(this.contents, content => _.isNil(content.parent))
      } else if (_.isArray(this.targetFolder.children)) {
        const childIds = this.targetFolder.children
        return _.filter(this.contents, content => _.includes(childIds, content.id))
      } else {
        return []
      }
    },

    folderContents () {
      if (this.sortGrouping === 'folders') {
        // Separate folders from docs and sort indepenently, then recombine.
        const folders = _.filter(this.unsortedFolderContents, item => item.type === 'Folder')
        folders.sort(this.sorter)
        const documents = _.filter(this.unsortedFolderContents, item => item.type === 'Document')
        documents.sort(this.sorter)
        return _.concat(folders, documents)
      } else {
        const items = _.clone(this.unsortedFolderContents)
        items.sort(this.sorter)
        return items
      }
    },

    sorter () {
      // Returns a function that sorts the contents.
      const ascending = (a, b) => a < b
      const descending = (a, b) => a > b
      const comparator = this.sortDirection === 'ascending' ? ascending : descending

      const byTitle = (a, b) => comparator(a.title, b.title) ? 1 : -1
      const byUpdated = (a, b) => comparator(a.updated.seconds, b.updated.seconds) ? 1 : -1

      return this.sortField === 'title' ? byTitle : byUpdated
    }
  },  // computed

  methods: {
    createFolder () {
      const now = new Date()
      const newContent = {
        title: 'An Untitled Folder',
        type: 'Folder',
        children: [],
        trashed: false,
        created: now,
        updated: now
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
            children: this.targetFolder.children,
            updated: now
          })
        } else {
          return null
        }
      }).then(() => {
        console.debug('Created folder')
      })
    },

    createDocument () {
      const now = new Date()

      const documentsRef = fb.getCollection('documents')
      const newDocumentRef = documentsRef.doc()
      const newDocument = {
        title: 'Untitled Document',
        content: '',
        created: now,
        updated: now
      }

      const contentsRef = fb.getCollection('contents')
      const newContentRef = contentsRef.doc()
      const newContent = {
        title: 'Untitled Document',
        key: newDocumentRef.id,
        type: 'Document',
        trashed: false,
        created: now,
        updated: now,
        parent: null,
        starred: false
      }

      // Customize the table-of-contents object for the current state.
      if (this.isStarredFolder) {
        // If the user is looking at the starred items, create this document as starred.
        // And create it in the Home folder.
        newContent.starred = true
      } else if (_.isObject(this.targetFolder)) {
        // Create the unstarred document in the folder that's open.
        newContent.parent = this.targetFolder.id
      }

      fb.db.runTransaction(transaction => {
        // Create the document.
        transaction.set(newDocumentRef, newDocument)

        // Create the requisite table-of-contents object.
        transaction.set(newContentRef, newContent)

        // Update the target folder by adding a new child.
        if (_.isObject(this.targetFolder)) {
          const targetFolderRef = fb.getCollection('contents').doc(this.targetFolder.id)

          if (_.isArray(this.targetFolder.children)) {
            this.targetFolder.children.push(newContentRef.id)
          } else {
            this.targetFolder.children = [newContentRef.id]
          }

          transaction.update(targetFolderRef, {
            children: this.targetFolder.children,
            updated: now
          })
        }

        // Must return a promise from the transaction predicate.
        return new Promise((resolve, reject) => {
          _.noop(reject)
          resolve()
        })
      }).then(() => {
        // Transaction complete. Redirect to the document's page.
        console.log('Created document:', newDocumentRef.id)

        const urlId = util.getDocUrlId({
          id: newDocumentRef.id,
          title: newDocument.title
        })

        this.$router.push({ name: 'NewDocument', params: { id: urlId } })
      }).catch(error => {
        console.error("Document creation failed:", error);
      })
    }, // end createDocument

    navigateToEnclosingFolder () {
      this.$store.commit('setTargetFolder', this.targetFolder.parent || null)
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
          title: this.folderTitle,
          updated: new Date()
        }).then(() => {
          console.debug('Updated folder title')
        })
      }
    },

    trashFolder () {
      if (this.isRootFolder) { return }
      if (_.isNil(this.targetFolder)) { return }

      const folderTitle = this.targetFolder.title
      const parentKey = this.targetFolder.parent
      const contentRef = fb.getCollection('contents').doc(this.sidebarTarget)
      contentRef.update({
        trashed: true,
        updated: new Date()
      }).then(() => {
        console.debug('Trashed a folder:', folderTitle)
        this.$store.commit('setTargetFolder', parentKey)
      })
    }
  } // methods
}
</script>
