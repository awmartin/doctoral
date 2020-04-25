<template>
  <div class="contents-list">
    <div class="header">
      <div class="location">
        <button @click="navigateToEnclosingFolder" :disabled="sidebarHasHomeFolderOpen || sidebarHasStarredFolderOpen">
          <backspace-outline-icon />
        </button>

        <span class="folder-title" v-if="sidebarHasHomeFolderOpen">Home</span>
        <span class="folder-title" v-if="sidebarHasStarredFolderOpen">Starred</span>
        <input type="text" class="folder-title" v-model="sidebarFolderTitle" v-if="!sidebarHasHomeFolderOpen && !sidebarHasStarredFolderOpen" />
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
        <folder-bar :folder="sidebarTargetFolder" />
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
        <double-press-button :click="trashFolder" v-if="!sidebarHasHomeFolderOpen && !sidebarHasStarredFolderOpen">
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
      if (this.isSavingFolder) {
        this.updateFolder_()
      }
    }
  },

  data () {
    return {
      saveTimer: null
    }
  },

  computed: {
    ...mapState(['sidebarTarget', 'sortDirection', 'sortGrouping', 'sortField', 'filterTag']),
    ...mapGetters(['getContent', 'getFolderContents', 'isSavingFolder', 'starredContents']),

    sidebarTargetFolder () {
      if (this.sidebarHasStarredFolderOpen) {
        return {
          id: 'STARRED',
          title: 'Starred',
          children: _.map(this.starredContents, content => content.id)
        }
      } else {
        return this.getContent(this.sidebarTarget)
      }
    },

    sidebarHasHomeFolderOpen () {
      return _.isNil(this.sidebarTarget) && this.filterTag !== 'starred'
    },

    sidebarHasStarredFolderOpen () {
      return this.filterTag === 'starred'
    },

    sidebarFolderTitle: {
      get () {
        if (this.sidebarHasHomeFolderOpen) {
          return 'Home'
        } else if (_.isObject(this.sidebarTargetFolder)) {
          return this.sidebarTargetFolder.title
        } else {
          return ''
        }
      },
      set (newTitle) {
        if (!this.isRootFolder) {
          this.sidebarTargetFolder.title = newTitle
          this.updateFolderTitle()
        }
      }
    },

    unsortedFolderContents () {
      if (this.filterTag === 'starred') {
        return this.starredContents
      } else {
        return this.getFolderContents(this.sidebarTargetFolder)
      }
    },

    unsortedFolders () {
      return _.filter(this.unsortedFolderContents, item => item.type === 'Folder')
    },

    unsortedDocuments () {
      return _.filter(this.unsortedFolderContents, item => item.type === 'Document')
    },

    sorter () {
      // Returns a function that sorts the contents.
      const ascending = (a, b) => a < b
      const descending = (a, b) => a > b
      const comparator = this.sortDirection === 'ascending' ? ascending : descending

      const byTitle = (a, b) => comparator(a.title, b.title) ? 1 : -1
      const byUpdated = (a, b) => comparator(a.updated.seconds, b.updated.seconds) ? 1 : -1

      return this.sortField === 'title' ? byTitle : byUpdated
    },

    folderContents () {
      if (this.sortGrouping === 'folders') {
        // Separate folders from docs and sort indepenently, then recombine.

        const sortedFolders = _.clone(this.unsortedFolders)
        sortedFolders.sort(this.sorter)
        const sortedDocuments = _.clone(this.unsortedDocuments)
        sortedDocuments.sort(this.sorter)

        return _.concat(sortedFolders, sortedDocuments)
      } else {
        const items =  _.clone(this.unsortedFolderContents)
        items.sort(this.sorter)
        return items
      }
    }
  },  // computed

  methods: {
    createFolder () {
      const onSuccess = folder => {
        console.log('Created folder:', folder.id)
      }

      const onError = error => {
        console.error('Error while creating folder:', error)
      }

      this.$store.dispatch('createFolder', {
        folder: this.sidebarTargetFolder,
        starred: this.sidebarHasStarredFolderOpen,
        onSuccess,
        onError
      })
    },

    createDocument () {
      const onSuccess = doc => {
        console.log('Created document:', doc.document.id)

        const urlId = util.getDocUrlId({
          id: doc.document.id,
          title: doc.document.title
        })

        this.$router.push({ name: 'NewDocument', params: { id: urlId } })
      }

      const onError = error => {
        console.error('Error while creating document:', error)
      }

      this.$store.dispatch('createDocument', {
        folder: this.sidebarTargetFolder,
        starred: this.sidebarHasStarredFolderOpen,
        onSuccess,
        onError
      })
    },

    navigateToEnclosingFolder () {
      this.$store.commit('setTargetFolder', this.sidebarTargetFolder.parent || null)
    },

    updateFolder () {
      this.$store.dispatch('startSavingFolderTimer', this.updateFolder_)
    },

    updateFolder_ () {
      if (!this.isRootFolder) {
        const data = {
          title: this.folderTitle,
          updated: new Date()
        }

        const onSuccess = folder => {
          console.log('Updated folder:', folder.content.title)
        }

        const onError = error => {
          console.error('Error occurred while updating folder:', error)
        }

        this.dispatch('updateFolder', {
          folder: this.sidebarTargetFolder,
          data,
          onSuccess,
          onError
        })
      }
    },

    trashFolder () {
      if (this.sidebarHasHomeFolderOpen || this.sidebarHasStarredFolderOpen) { return }

      const folderTitle = this.sidebarTargetFolder.title
      const parentKey = this.sidebarTargetFolder.parent
      const onSuccess = () => {
        console.log('Sent a folder to the trash:', folderTitle)
        this.$store.commit('setTargetFolder', parentKey)
      }

      const onError = error => {
        console.error('Error occurred when moving a folder to the trash:', error)
      }

      this.$store.dispatch('trashFolder', {
        folder: this.sidebarTargetFolder,
        onSuccess,
        onError
      })
    }
  } // methods
}
</script>
