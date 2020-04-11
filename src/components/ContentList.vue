<template>
  <div class="contents-list">
    <div class="header">
      <div class="location">
        <button @click="navigateToEnclosingFolder" :disabled="isRootFolder">
          <backspace-outline-icon />
        </button>

        <!-- <folder-outline-icon /> -->

        <span class="folder-title" v-if="isRootFolder">Home</span>
        <input type="text" class="folder-title" v-model="folderTitle" v-else />
      </div>

      <div class="buttons">
        <magnify-icon />

        <input ref="search"
          type="text"
          class="search"
          v-model="searchQuery"
          @keyup.esc.exact="clearQuery"
          @keyup.enter.exact="openHighlightedResult"
          @keydown.up.exact="previousResult"
          @keydown.down.exact="nextResult" />

        <div class="search-results" v-if="isSearching">
          <content-link v-for="result in searchResults" 
            :key="result.id"
            :content="result"
            :withClick="clearQuery"
            :class="searchResultClass(result)"
            />
        </div>

        <button @click="createFolder">
          <plus-icon /><folder-outline-icon />
        </button>

        <button @click="createDocument">
          <plus-icon /><file-document-outline-icon />
        </button>
      </div>
    </div>

    <content-link v-for="content in folderContents"
      v-bind:key="content.id"
      v-bind:content="content">
    </content-link>

    <div class="footer">
      <button @click="trashFolder" v-if="!isRootFolder">
        <delete-outline-icon />
      </button>
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
.footer {
  position: absolute;
  padding: 10px;
  bottom: 0px;
}

.location {
  display: flex;
  align-items: center;
  padding: 5px 0;
  font-size: 1.2rem;
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

input.search {
  font-size: 1.0rem;
  border: none;
  outline: none;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  border-bottom: 1px solid lighten(lightskyblue, 20%);
  flex-grow: 2;
  margin-right: 5px;
}
.search-results {
  position: absolute;
  width: 300px;
  height: 400px;
  overflow-y: scroll;
  background-color: white;
  border: 2px solid lightskyblue;
  z-index: 2;
  top: 40px;
  padding: 5px;
}
.content-link.result {
  border: 1px solid transparent;
  &.highlighted {
    border: 1px solid lightskyblue;
  }
}

.buttons {
  display: flex;
  position: relative;
  .magnify-icon {
    margin-right: 4px;
  }
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
import DeleteOutlineIcon from 'vue-material-design-icons/DeleteOutline'
import MagnifyIcon from 'vue-material-design-icons/Magnify'
import util from '@/lib/util'

const fb = require('../firebase.js')
const _ = require('lodash')

export default {
  name: 'DocumentList',

  components: {
    FileDocumentOutlineIcon,
    PlusIcon,
    FolderOutlineIcon,
    BackspaceOutlineIcon,
    ContentLink,
    DeleteOutlineIcon,
    MagnifyIcon
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
      saveTimer: null,
      searchQuery: '',
      highlightedSearchIndex: 0
    }
  },

  computed: {
    ...mapState(['contents', 'currentUser', 'sidebarTarget']),

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
    },

    contentsWithHome () {
      return _.concat(this.contents, { id: null, title: 'Home', type: 'Folder' })
    },

    searchResults () {
      if (!this.isSearching) { return [] }
      const results = _.filter(this.contentsWithHome, content => _.includes(_.toLower(content.title), _.toLower(this.searchQuery)))
      results.sort((a, b) => _.startsWith(_.toLower(a.title), _.toLower(this.searchQuery)) && !_.startsWith(_.toLower(b.title), _.toLower(this.searchQuery)) ? -1 : 1)
      return results
    },

    isSearching () {
      return !_.isEmpty(_.trim(this.searchQuery))
    },

    highlightedSearchResult () {
      if (_.isFinite(this.highlightedSearchIndex)) {
        return this.searchResults[this.highlightedSearchIndex]
      } else {
        return null
      }
    }
  },

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
      // TODO Consider marking all children as trashed.

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

        // TODO If we're looking at a document that was in this folder, then navigate away.
      })
    },

    clearQuery () {
      this.searchQuery = ''
      this.highlightedSearchIndex = 0
    },

    nextResult () {
      if (_.size(this.searchResults) === 0) { return }
      if (_.isNil(this.highlightedSearchIndex)) {
        this.highlightedSearchIndex = 0
      } else {
        this.highlightedSearchIndex += 1
        if (this.highlightedSearchIndex >= _.size(this.searchResults)) {
          this.highlightedSearchIndex = 0
        }
      }
    },

    previousResult () {
      if (_.size(this.searchResults) === 0) { return }
      if (_.isNil(this.highlightedSearchIndex)) {
        this.highlightedSearchIndex = _.size(this.searchResults) - 1
      } else {
        this.highlightedSearchIndex -= 1
        if (this.highlightedSearchIndex < 0) {
          this.highlightedSearchIndex = _.size(this.searchResults) - 1
        }
      }
    },

    searchResultClass (result) {
      if (_.isObject(this.highlightedSearchResult) && result.id === this.highlightedSearchResult.id) {
        return 'result highlighted'
      } else {
        return 'result'
      }
    },

    openHighlightedResult () {
      if (_.isObject(this.highlightedSearchResult)) {
        if (this.highlightedSearchResult.type === 'Folder') {
          this.$store.commit('setTargetFolder', this.highlightedSearchResult.id)
        } else if (this.highlightedSearchResult.type === 'Document') {
          const urlId = util.getDocUrlId(this.highlightedSearchResult)
          this.$router.push({ name: 'Document', params: { id: urlId }})
        }
      }
      this.clearQuery()
    }
  } // methods
}
</script>
