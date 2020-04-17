<template>
  <div class="contents-list">
    <div class="header">
      <div class="location">
        <button @click="navigateToEnclosingFolder" :disabled="isRootFolder">
          <backspace-outline-icon />
        </button>

        <span class="folder-title" v-if="isRootFolder">Home</span>
        <input type="text" class="folder-title" v-model="folderTitle" v-else />
      </div>

      <div class="buttons">
        <search-dropdown />

        <button @click="createDocument">
          <file-document-outline-icon />
        </button>

        <button @click="createFolder">
          <folder-outline-icon />
        </button>

        <move-dropdown :content="targetFolder" />
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
        <double-press-button :click="trashFolder" v-if="!isRootFolder">
          <delete-outline-icon />
        </double-press-button>
      </div>

      <div class="right">
        <button @click="sortByTitle" :class="getSortButtonClass('sortByTitle')">
          <sort-alphabetical-icon />
        </button>
        <button @click="sortByLastUpdated" :class="getSortButtonClass('sortByLastUpdated')">
          <clock-outline-icon />
        </button>

        <button @click="sortByDescending" :class="getSortButtonClass('sortByDescending')">
          <sort-descending-icon />
        </button>
        <button @click="sortByAscending" :class="getSortButtonClass('sortByAscending')">
          <sort-ascending-icon />
        </button>

        <button @click="sortFoldersToTop" :class="getSortButtonClass('sortFoldersToTop')">
          <folder-outline-icon />
        </button>
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
  padding: 10px;
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
}

.buttons {
  display: flex;
  margin-bottom: 5px;
  width: 100%;
  align-items: center;
}
button {
  margin-right: 5px;
  &[disabled] {
    background-color: #eee;
  }
  &.unselected {
    background-color: #ddd;
  }
  &.unselected:hover {
    background-color: darken(#ddd, 10%);
  }
  &.unselected:active {
    background-color: darken(#ddd, 20%);
  }
}

.left {
  display: flex;
  justify-content: flex-start;
}
.right {
  display: flex;
  justify-content: flex-end;
  button {
    margin-left: 5px;
    margin-right: 0;
  }
}
</style>

<script>
import { mapState } from 'vuex'

import ContentLink from '@/components/ContentLink'
import MoveDropdown from '@/components/MoveDropdown'
import SearchDropdown from '@/components/SearchDropdown'
import DoublePressButton from '@/components/DoublePressButton'
import util from '@/lib/util'

import FileDocumentOutlineIcon from 'vue-material-design-icons/FileDocumentOutline'
import FolderOutlineIcon from 'vue-material-design-icons/FolderOutline'
import BackspaceOutlineIcon from 'vue-material-design-icons/BackspaceOutline'
import DeleteOutlineIcon from 'vue-material-design-icons/DeleteOutline'
import ClockOutlineIcon from 'vue-material-design-icons/ClockOutline'
import SortAlphabeticalIcon from 'vue-material-design-icons/SortAlphabetical'
import SortAscendingIcon from 'vue-material-design-icons/SortAscending'
import SortDescendingIcon from 'vue-material-design-icons/SortDescending'

const fb = require('../firebase.js')
const _ = require('lodash')

export default {
  name: 'DocumentList',

  components: {
    FileDocumentOutlineIcon,
    FolderOutlineIcon,
    BackspaceOutlineIcon,
    ContentLink,
    DoublePressButton,
    DeleteOutlineIcon,
    MoveDropdown,
    SearchDropdown,
    ClockOutlineIcon,
    SortAlphabeticalIcon,
    SortAscendingIcon,
    SortDescendingIcon
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
    ...mapState(['contents', 'currentUser', 'sidebarTarget', 'sortDirection', 'sortGrouping', 'sortField']),

    targetFolder () {
      if (this.isRootFolder) {
        return null
      } else {
        return _.find(this.contents, item => item.id === this.sidebarTarget)
      }
    },

    isRootFolder () {
      return _.isNil(this.sidebarTarget)
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
      let newDocumentId = null

      const now = new Date()

      const newDocument = {
        title: 'Untitled Document',
        content: '',
        created: now,
        updated: now
      }

      const documentsRef = fb.getCollection('documents')
      documentsRef.add(newDocument).then(docRef => {
        newDocumentId = docRef.id

        const newContent = {
          title: 'Untitled Document',
          key: newDocumentId,
          type: 'Document',
          trashed: false,
          created: now,
          updated: now
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
            children: this.targetFolder.children,
            updated: now
          })
        } else {
          return null
        }
      }).then(() => {
        console.debug('Created document', newDocumentId)
        const urlId = util.getDocUrlId({
          id: newDocumentId,
          title: newDocument.title
        })
        this.$router.push({ name: 'NewDocument', params: { id: urlId } })
      })
    },

    getContent (id) {
      return _.find(this.contents, content => content.id === id)
    },

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
    },

    sortFoldersToTop () {
      if (this.sortGrouping === 'folders') {
        this.$store.commit('setSortGroupingNone')
      } else {
        this.$store.commit('setSortGroupingFolders')
      }
    },

    sortByLastUpdated () {
      this.$store.commit('setSortByLastUpdated')
    },

    sortByTitle () {
      this.$store.commit('setSortByTitle')
    },

    sortByAscending () {
      this.$store.commit('setSortDirectionAscending')
    },

    sortByDescending () {
      this.$store.commit('setSortDirectionDescending')
    },

    getSortButtonClass (sortType) {
      if (sortType === 'sortFoldersToTop') {
        return this.sortGrouping === 'folders' ? 'selected' : 'unselected'
      } else if (sortType === 'sortByLastUpdated') {
        return this.sortField === 'updated' ? 'selected' : 'unselected'
      } else if (sortType === 'sortByTitle') {
        return this.sortField === 'title' ? 'selected' : 'unselected'
      } else if (sortType === 'sortByAscending') {
        return this.sortDirection === 'ascending' ? 'selected' : 'unselected'
      } else if (sortType === 'sortByDescending') {
        return this.sortDirection === 'descending' ? 'selected' : 'unselected'
      } else {
        return 'unselected'
      }
    }
  } // methods
}
</script>
