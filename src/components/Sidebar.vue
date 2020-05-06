<template>
  <div class="sidebar">
    <div class="header">
      <div class="location">
        <button @click="navigateToEnclosingFolder" :disabled="sidebarHasHomeFolderOpen || sidebarHasStarredFolderOpen">
          <backspace-outline-icon />
        </button>

        <span class="folder-title" v-if="sidebarHasHomeFolderOpen">Home</span>
        <span class="folder-title" v-if="sidebarHasStarredFolderOpen">Starred</span>
        <input type="text"
          ref="folder-title"
          class="folder-title"
          v-model="sidebarFolderTitle"
          v-if="!sidebarHasHomeFolderOpen && !sidebarHasStarredFolderOpen"
        />
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

    <content-list :contents="folderContents" 
      :grouping="sortGrouping"
      :direction="sortDirection"
      :field="sortField"
    />

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
.sidebar {
  position: relative;
  height: 100%;
  width: 18%;
  min-width: 250px;
  border-right: 1px solid #eee;
}

.header {
  padding: 5px 10px 10px 10px;
}
.content-list {
  height: calc(100% - 136px - 52px);
}
.footer {
  padding: 10px;
  height: 32px;
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
import Vue from 'vue'
import { mapState, mapGetters } from 'vuex'

import ContentList from '@/components/ContentList'
import SearchDropdown from '@/components/SearchDropdown'
import DoublePressButton from '@/components/DoublePressButton'
import SortBar from '@/components/SortBar'
import FilterBar from '@/components/FilterBar'
import FolderBar from '@/components/FolderBar'
import Content from '@/models/Content'

import FileDocumentOutlineIcon from 'vue-material-design-icons/FileDocumentOutline'
import FolderOutlineIcon from 'vue-material-design-icons/FolderOutline'
import BackspaceOutlineIcon from 'vue-material-design-icons/BackspaceOutline'
import DeleteOutlineIcon from 'vue-material-design-icons/DeleteOutline'

const _ = require('lodash')

export default {
  name: 'Sidebar',

  components: {
    FileDocumentOutlineIcon,
    FolderOutlineIcon,
    BackspaceOutlineIcon,
    ContentList,
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

  // TODO Change the folder object for the home folder from null to Content.homeFolder

  computed: {
    ...mapState(['sidebarTarget', 'sortDirection', 'sortGrouping', 'sortField', 'filterTag']),
    ...mapGetters(['getContent', 'getFolderContents', 'isSavingFolder', 'starredContents']),

    isHomeFolder () {
      return _.isNil(this.sidebarTarget)
    },

    sidebarTargetFolder () {
      if (this.sidebarHasStarredFolderOpen) {
        return Content.starredFolder
      } else if (this.sidebarHasHomeFolderOpen) {
        return Content.homeFolder
      } else {
        return this.getContent(this.sidebarTarget)
      }
    },

    sidebarHasHomeFolderOpen () {
      return _.isNil(this.sidebarTarget) && !this.sidebarHasStarredFolderOpen
    },

    sidebarHasStarredFolderOpen () {
      return this.filterTag === 'starred'
    },

    sidebarFolderTitle: {
      get () {
        return this.sidebarTargetFolder ? this.sidebarTargetFolder.title : ''
      },
      set (newTitle) {
        if (!this.isHomeFolder) {
          this.sidebarTargetFolder.setTitle(newTitle)
          this.updateFolder()
        }
      }
    },

    folderContents () {
      return this.getFolderContents(this.sidebarTargetFolder)
    }
  },  // computed

  methods: {
    createFolder () {
      const onSuccess = folder => {
        console.log('Created folder:', folder.id)

        this.$store.commit('setTargetFolder', folder.id)

        Vue.nextTick(() => {
          this.$refs['folder-title'].select()
        })
      }

      const onError = error => {
        console.error('Error while creating folder:', error)
      }

      this.$store.dispatch('createFolder', {
        parent: this.sidebarTargetFolder,
        onSuccess,
        onError
      })
    },

    createDocument () {
      const onSuccess = document => {
        console.log('Created document:', document.id)
        this.$router.push({ name: 'NewDocument', params: { id: document.urlId() } })
      }

      const onError = error => {
        console.error('Error while creating document:', error)
      }

      this.$store.dispatch('createDocument', {
        parent: this.sidebarTargetFolder,
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
      if (!this.isHomeFolder) {
        const onSuccess = () => {
          console.log('Updated folder:', this.sidebarFolderTitle)
        }

        const onError = error => {
          console.error('Error occurred while updating folder:', error)
        }

        this.$store.dispatch('updateFolder', {
          folder: this.sidebarTargetFolder,
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
