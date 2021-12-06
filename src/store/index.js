import Vuex from 'vuex'

import Document from '@/models/Document'
import Content from '@/models/Content'
import FileUploader from '@/lib/file-uploader'
import util from '@/lib/util'

const uniqueSlug = require('unique-slug')
const _ = require('lodash')

const store = Vuex.createStore({
  state: {
    adapter: null,
    editor: null,

    currentUser: null,
    username: null,
    userListener: null,

    contentsListener: null,
    contents: [],
    trashListener: null,
    trashedItems: [],
    archiveListener: null,
    archiveContents: [],

    sidebarTarget: null,
    appBootstrapState: 'unknown',

    sortDirection: 'ascending',
    sortGrouping: 'none',
    sortField: 'title',
    filterTag: 'all',
    tagViewLayout: 'document-tree',

    manualOverrideShowSidebar: false,
    isSavingDocument: false,

    currentDocument: null
  },

  getters: {
    // ------------------------------ AUTH STATE ------------------------------

    isLoggedIn (state) {
      return _.isObject(state.currentUser) && state.appBootstrapState === 'logged-in'
    },

    isReady (state) {
      return state.appBootstrapState === 'logged-in' || state.appBootstrapState === 'not-logged-in'
    },

    isReadyNotLoggedIn (state) {
      return state.appBootstrapState === 'not-logged-in'
    },

    isPending (state) {
      return state.appBootstrapState === 'unknown'
    },

    userEmail (state) {
      return state.currentUser.email
    },

    // ------------------------------ CONTENT MANAGEMENT ------------------------------

    getContent (state, getters) {
      return contentId => {
        // TODO The home folder is sometimes still represented as null. This should just be Content.homeFolder.
        if (_.isNil(contentId)) { return null }
        if (contentId === Content.tagsList.id) { return Content.tagsList }
        if (contentId === Content.archiveFolder.id) { return Content.archiveFolder }
        return _.find(getters.activeContents, content => content.id === contentId)
      }
    },

    getArchivedContent (state, getters) {
      return contentId => {
        if (_.isNil(contentId)) { return null }
        if (contentId === Content.tagsList.id) { return Content.tagsList }
        if (contentId === Content.archiveFolder.id) { return Content.archiveFolder }
        return _.find(getters.archiveContents, content => content.id === contentId)
      }
    },

    getContentByDocumentKey (state) {
      return documentKey => _.find(state.contents, content => content.key === documentKey)
    },

    getTrashed (state, getters) {
      return contentId => {
        if (_.isNil(contentId)) { return null }
        return _.find(getters.trashedContents, content => content.id === contentId)
      }
    },

    homeChildren (state, getters) {
      return _.filter(getters.activeContents, content => _.isEmpty(content.parent))
    },

    starredContents (state, getters) {
      return _.filter(getters.activeContents, content => content.starred)
    },

    trashedContents (state) {
      const trashedFromContent = _.filter(state.contents, content => content.trashed)
      return _.isEmpty(state.trashedItems) ? trashedFromContent : state.trashedItems
    },

    // Returns all contents a user is working on. i.e. Contents that aren't trashed or archived.
    activeContents (state) {
      return _.filter(state.contents, content => !content.trashed && !content.archived)
    },

    archiveContents (state) {
      return state.archiveContents
    },

    sidebarFolderContents (state, getters) {
      return getters.getFolderContents(getters.sidebarTargetFolder)
    },

    sidebarTargetFolder (state, getters) {
      if (state.filterTag === 'all') {
        if (_.isNil(state.sidebarTarget)) {
          return Content.homeFolder
        } else {
          return getters.getContent(state.sidebarTarget) || Content.emptyFolder
        }
      } else if (state.filterTag === 'starred') {
        return Content.starredFolder
      } else if (state.filterTag === 'all-documents') {
        return Content.allDocumentsFolder
      } else if (state.filterTag === 'all-folders') {
        return Content.allFoldersFolder
      } else if (state.filterTag === 'tagslist') {
        return Content.tagsList
      } else {
        return Content.homeFolder
      }
    },

    getFolderContents (state, getters) {
      return folder => {
        if (Content.isHomeFolder(folder)) {
          return getters.homeChildren
        } else if (folder.isStarredFolder) {
          return getters.starredContents
        } else if (folder.isAllDocumentsFolder) {
          return _.filter(getters.activeContents, content => content.isDocument)
        } else if (folder.isAllFoldersFolder) {
          return _.filter(getters.activeContents, content => content.isFolder)
        } else if (folder.isFolder) {
          return _.filter(getters.activeContents, content => content.parent === folder.id)
        } else {
          return []
        }
      }
    },

    getChildFolders (state, getters) {
      return folder => _.filter(getters.getFolderContents(folder), content => content.isFolder)
    },

    // ------------------------------ CONTENT STATE ------------------------------

    isInTrashedAncestorFolder (state, getters) {
      return content => {
        if (_.isNil(content)) { return false }
      
        // If this content isn't trashed and in the home folder, we're ok.
        const contentInHomeFolder = _.isNil(content.parent)
        if (contentInHomeFolder) { return false }
      
        // Look up the ancestor tree to see if one of the containing folders is trashed.
        let parent = content
      
        while (!Content.isHomeFolder(parent)) {
          const inHomeFolder = _.isEmpty(parent.parent)
          if (inHomeFolder) {
            return false
          }

          parent = getters.getContent(parent.parent)
        }
      
        // When the loop breaks, the home folder wasn't reached, thus one
        // of the parents wasn't available in 'contents', which includes
        // all un-trashed docs.
        return true
      }
    }
  },

  actions: {
    registerBackendAdapter(context, adapter) {
      context.commit('setBackendAdapter', adapter)

      function gotUser (user) {
        context.dispatch('bootstrapUserData', user)
      }

      function noUser () {
        context.commit('setBootstrapState', 'not-logged-in')
      }
      
      adapter.registerAuthCallback(gotUser, noUser)
    },

    login (context, params) {
      context.state.adapter.authenticate(params)
    },

    logout (context, { onSuccess = _.noop, onError = _.noop } ) {
      // TODO Make actions composable.

      // clearProfile
      context.commit('setCurrentUser', null)
      context.commit('setUsername', null)

      // unsubscribeFromListeners
      if (_.isFunction(context.state.contentsListener)) {
        context.state.contentsListener()
        context.commit('setContentsListener', null)
      }

      if (_.isFunction(context.state.userListener)) {
        context.state.userListener()
        context.commit('setUserListener', null)
      }

      context.state.adapter.deauthenticate().then(onSuccess).catch(onError)
    },

    bootstrapUserData (context, user) {
      const onContentsUpdate = contents => {
        context.commit('setContents', contents)
      }
      const contentsListener = context.state.adapter.registerContentsListener(onContentsUpdate)

      const onUserStateUpdate = userData => {
        if (_.has(userData, 'username')) {
          context.commit('setUsername', userData.username)
        }

        if (_.has(userData, 'sortDirection')) {
          context.state.sortDirection = userData.sortDirection
        }

        if (_.has(userData, 'sortField')) {
          context.state.sortField = userData.sortField
        }

        if (_.has(userData, 'sortGrouping')) {
          context.state.sortGrouping = userData.sortGrouping
        }
      }
      const userListener = context.state.adapter.registerUserStateListener(onUserStateUpdate)

      context.commit('setCurrentUser', user)
      context.commit('setContentsListener', contentsListener)
      context.commit('setBootstrapState', 'logged-in')
      context.commit('setUserListener', userListener)
    },

    registerArchiveListener (context) {
      if (_.isFunction(context.state.archiveListener)) {
        // Already listening, so return.
        return
      }

      const onUpdate = items => {
        context.commit('setArchiveContents', items)
      }

      const listener = context.state.adapter.registerArchiveListener(onUpdate)
      context.commit('setArchiveListener', listener)
    },

    deregisterArchiveListener (context) {
      if (_.isFunction(context.state.archiveListener)) {
        context.state.archiveListener()
      }
      context.commit('setArchiveListener', null)
      context.commit('setArchiveContents', [])
    },

    registerTrashListener (context) {
      if (_.isFunction(context.state.trashListener)) {
        // Already listening, so return.
        return
      }

      const onUpdate = items => {
        context.commit('setTrashedItems', items)
      }

      const listener = context.state.adapter.registerTrashListener(onUpdate)
      context.commit('setTrashListener', listener)
    },

    deregisterTrashListener (context) {
      if (_.isFunction(context.state.trashListener)) {
        context.state.trashListener()
      }
      context.commit('setTrashListener', null)
      context.commit('setTrashedItems', [])
    },

    createFile (context, { file, parent }) {
      const uploader = new FileUploader(context.state.adapter)
      return uploader.uploadFile(file, parent)
    },

    createDocument (context, { parent, id = null, title = null, onSuccess = _.noop, onError = _.noop }) {
      console.log('Creating a document in', parent)

      const document = Document.new()

      context.state.adapter.provisionNewContentReference()
      .then(newContentRef => {
        document.content.setId(newContentRef.id)
        return context.state.adapter.provisionNewDocumentReference(id)
      })
      .then(newDocumentRef => {
        document.setId(newDocumentRef.id)
        if (_.isString(title)) {
          document.setTitle(title)
        }

        let parentFolder = null
        // Customize the table-of-contents object for the current state.
        if (Content.isContentForFolder(parent) && parent.isStarredFolder) {
          // If the user is looking at the starred items, create this document as starred.
          // And create it in the Home folder.
          document.star()
        } else if (Content.isContentForFolder(parent) && parent.canHaveChildren) {
          // Create the unstarred document in the folder that's open, if not starred.
          parent.addChild(document.content)
          parentFolder = parent
        }

        return context.state.adapter.createDocument(document, parentFolder)
      })
      .then(onSuccess)
      .catch(onError)
    },

    updateDocument (context, { document }) {
      if (_.isNil(document)) {
        return new Promise((resolve, reject) => {
          reject('Attempted to update a document, but the data provided was null.')
        })
      }
      if (!Content.isContentForDocument(document.content)) {
        return new Promise((resolve, reject) => {
          reject('Attempted to update a document, but the associated content was null or improperly formatted.')
        })
      }
      if (!Document.isDocument(document)) {
        return new Promise((resolve, reject) => {
          reject('Attempted to update a document, but the document provided was improperly formatted.')
        })
      }

      return context.state.adapter.updateDocument(document)
    },

    publishDocument (context, { document, onSuccess = _.noop, onError = _.noop }) {
      if (!Document.isDocument(document)) {
        onError('Attempted to publish a document, but did\'t get a document to publish:', document)
        return
      }
      console.log('Publishing document:', document.id)
      const slug = _.toLower(util.getTitleUrl(document.title))
      context.state.adapter.publishDocument(document, slug).then(onSuccess).catch(onError)
    },

    loadDocument (context, { documentKey, onSuccess, onError = _.noop }) {
      const onLoadSuccess = document => {
        if (Document.isDocument(document)) {
          const content = context.getters.getContentByDocumentKey(document.id)

          if (Content.isContentForDocument(content)) {
            document.setTableOfContentsReference(content)
            return document
          } else {
            const archivedId = uniqueSlug() + uniqueSlug() + uniqueSlug()
            const archiveContent = new Content.Content(
              document.title,
              'Document', // type
              false, // starred
              false, // trashed
              archivedId, // id
              document.id, // key
              'ARCHIVEFOLDER', // parent
              document.created,
              document.updated,
              [], // tags
              true // archived
            )
            document.setTableOfContentsReference(archiveContent)
            return document
            // throw new Error('Could not find the associated content object.')
          }
        }

        throw new Error('Loaded document was not correctly formed.')
      }

      context.state.adapter.loadDocument(documentKey).then(onLoadSuccess).then(onSuccess).catch(onError)
    },

    loadTagSnippets (context, { tag, onSuccess, onError = _.noop }) {
      const onLoadSuccess = snippets => {
        return snippets
      }
      context.state.adapter.loadTagSnippets(tag).then(onLoadSuccess).then(onSuccess).catch(onError)
    },

    toggleStar (context, { content, onSuccess = _.noop, onError = _.noop }) {
      content.toggleStar()

      const updateCurrentDocumentIfNeeded = () => {
        if (context.state.currentDocument && context.state.currentDocument.content.id === content.id) {
          context.state.currentDocument.setTableOfContentsReference(content)
        }
      }

      context.state.adapter.updateContent(content)
        .then(updateCurrentDocumentIfNeeded)
        .then(onSuccess)
        .catch(onError)
    },

    moveContent (context, { contentToMove, destination, onSuccess = _.noop, onError = _.noop }) {
      // Returns null for home folder.
      const parent = context.getters.getContent(contentToMove.parent)

      if (Content.isContentForFolder(parent)) {
        parent.removeChild(contentToMove)
      }

      if (Content.isContentForFolder(destination)) {
        destination.addChild(contentToMove)
      } else {
        contentToMove.setParent(null)
      }

      const updateCurrentDocumentIfNeeded = () => {
        if (context.state.currentDocument && context.state.currentDocument.content.id === contentToMove.id) {
          context.state.currentDocument.setTableOfContentsReference(contentToMove)
        }
      }

      context.state.adapter.updateContent([contentToMove, parent, destination])
        .then(updateCurrentDocumentIfNeeded)
        .then(onSuccess)
        .catch(onError)
    },

    trashFile (context, { file, onSuccess = _.noop, onError = _.noop }) {
      if (_.isNil(file)) {
        onError('Provided file was null.')
      }
      if (!Content.isContentForFile(file)) {
        onError('Asked to send a file to the trash, but did\'t get a file.')
      }

      file.trash()

      context.state.adapter.updateContent(file)
        .then(onSuccess)
        .catch(onError)
    },

    trashDocument (context, { document, onSuccess = _.noop, onError = _.noop }) {
      if (_.isNil(document) || (_.isObject(document) && !_.isString(document.id))) {
        onError('Provided document was null.')
        return
      }
      if (!Document.isDocument(document)) {
        onError('Asked to send a document to the trash, but did\'t get a document.')
        return
      }

      document.trash()

      const updateCurrentDocumentIfNeeded = () => {
        if (context.state.currentDocument && context.state.currentDocument.content.id === document.content.id) {
          context.state.currentDocument.setTableOfContentsReference(document.content)
        }
      }

      context.state.adapter.updateContent(document.content)
        .then(updateCurrentDocumentIfNeeded)
        .then(onSuccess)
        .catch(onError)
    },

    createFolder (context, { parent, onSuccess = _.noop, onError = _.noop }) {
      const folder = Content.newFolder()

      let parentFolder = null
      context.state.adapter.provisionNewContentReference()
      .then(newFolderRef => {
        folder.setId(newFolderRef.id)
        
        if (Content.isContentForFolder(parent) && parent.isStarredFolder) {
          folder.star()
        } else if (Content.isContentForFolder(parent) && parent.canHaveChildren) {
          parent.addChild(folder)
          parentFolder = parent
        }

        return context.state.adapter.createContent(folder, parentFolder)
      })
      .then(onSuccess)
      .catch(onError)
    },

    updateFolder (context, { folder, onSuccess = _.noop, onError = _.noop }) {
      context.state.adapter.updateContent(folder).then(onSuccess).catch(onError)
    },

    trashFolder (context, { folder, onSuccess = _.noop, onError = _.noop }) {
      if (_.isNil(folder) || (_.isObject(folder) && !_.isString(folder.id))) {
        onError('Provided folder was null.')
        return
      }
      if (folder.type !== 'Folder') {
        onError('Asked to send a folder to the trash, but did\'t get a folder.')
        return
      }

      folder.trash()

      context.state.adapter.updateContent(folder).then(onSuccess).catch(onError)
    },

    restore (context, { content, onSuccess = _.noop, onError = _.noop }) {
      if (!Content.isContent(content)) {
        onError('Error while restoring something from the trash. Provided object wasn\'t a Content object.')
        return
      }

      content.restore()

      const parent = context.getters.getContent(content.parent) || context.getters.getTrashed(content.parent)

      if (Content.isContent(parent) && parent.trashed) {
        parent.removeChild(content)
      } else if (_.isNil(parent)) {
        content.setParent(null)
      }

      const updateCurrentDocumentIfNeeded = () => {
        if (context.state.currentDocument && context.state.currentDocument.content.id === content.id) {
          context.state.currentDocument.setTableOfContentsReference(content)
        }
      }

      context.state.adapter.updateContent([content, parent])
        .then(updateCurrentDocumentIfNeeded)
        .then(onSuccess)
        .catch(onError)
    },

    delete (context, { content, onSuccess = _.noop, onError = _.noop }) {
      console.log('Queueing for deletion:', content.title)

      // Start the process of defining what to delete recursively.

      let allItemsToDelete = []

      const deleteDocument_ = content_ => {
        console.log(`  Queueing ${content_.type} ${content_.title} for deletion.`)

        const item = {
          operation: 'DELETE',
          content: content_
        }

        allItemsToDelete.push(item)
      }

      const deleteDocument = content_ => {
        // TODO Remove tags as well.
        // Remove the document's content id from the children field of the containing folder.
        if (_.isString(content_.parent)) {
          const parentContent = context.getters.getContent(content_.parent) || context.getters.getTrashed(content_.parent)

          if (!_.isNil(parentContent)) {
            parentContent.removeChild(content_)

            const item = {
              operation: 'UPDATE',
              content: parentContent
            }

            allItemsToDelete.push(item)
          }
        }

        deleteDocument_(content_)
      }

      const deleteFolder_ = content_ => {
        console.log(`  Queueing ${content_.type} ${content_.title} for deletion.`)

        const item = {
          operation: 'DELETE',
          content: content_
        }

        allItemsToDelete.push(item)

        // Delete the children, recursively.
        _.forEach(content_.children, childId => {
          const child = context.getters.getContent(childId) || context.getters.getTrashed(childId)

          if (_.isObject(child)) {
            if (child.isDocument) {
              deleteDocument_(child)
            } else if (child.isFolder) {
              deleteFolder_(child)
            }
          }
        })
      }

      const deleteFolder = content_ => {
        // Remove the folders's content id from the 'children' field of the containing folder.
        if (!_.isNil(content_.parent)) {
          const parentContent = context.getters.getContent(content_.parent) || context.getters.getTrashed(content_.parent)

          if (!_.isNil(parentContent)) {
            parentContent.removeChild(content_)

            const item = {
              operation: 'UPDATE',
              content: parentContent
            }

            allItemsToDelete.push(item)
          }
        }

        deleteFolder_(content_)
      }

      if (content.isDocument) {
        deleteDocument(content)
      } else if (content.isFolder) {
        deleteFolder(content)
      }

      context.state.adapter.delete(allItemsToDelete).then(onSuccess).catch(onError)
    },

    clearProfile (context) {
      context.commit('setCurrentUser', null)
      context.commit('setUsername', null)
    },

    unsubscribeFromListeners (context) {
      if (_.isFunction(context.state.contentsListener)) {
        context.state.contentsListener()
        context.commit('setContentsListener', null)
      }

      if (_.isFunction(context.state.userListener)) {
        context.state.userListener()
        context.commit('setUserListener', null)
      }
    },

    registerEditor (context, editor) {
      context.commit('setEditorObject', editor)
    },

    deregisterEditor (context) {
      context.commit('setEditorObject', null)
    },

    focusEditor (context) {
      if (_.isObject(context.state.editor)) {
        context.state.editor.sourceElement.focus()
      }
    },

    showSidebar (context) {
      context.commit('setSidebarManualOverride', true)
    },

    hideSidebar (context) {
      context.commit('setSidebarManualOverride', false)
    },

    viewTagsAsDocumentTree (context) {
      context.commit('setTagViewLayout', 'document-tree')
    },

    viewTagsAsFlatList (context) {
      context.commit('setTagViewLayout', 'flat-list')
    },

    viewTagsAsGroupedTree (context) {
      context.commit('setTagViewLayout', 'grouped-tree')
    },

    viewDocumentsInSidebar (context) {
      context.commit('setFilterTag', 'all')
    },

    viewAllDocumentsInSidebar (context) {
      context.commit('setFilterTag', 'all-documents')
    },

    viewAllFoldersInSidebar (context) {
      context.commit('setFilterTag', 'all-folders')
    },

    viewStarredInSidebar (context) {
      context.commit('setFilterTag', 'starred')
    },

    viewTagsInSidebar (context) {
      context.commit('setFilterTag', 'tagslist')
    },

    setSidebarFolderAndFocus (context, folderContentId) {
      context.commit('setTargetFolder', folderContentId)
      context.commit('setFilterTag', 'all')
    },

    uploadFileForDocument (context, { file, document } ) {
      return context.state.adapter.uploadFileForDocument(file, document)
    },

    archive (context, { content }) {
      if (!Content.isContent(content)) {
        return new Promise((resolve, reject) => {
          reject('Attempted to archive an object, but the input provided was improperly formatted.')
        })
      }

      content.archive()

      return context.state.adapter.updateContent(content)
    },

    unarchive (context, { content }) {
      if (!Content.isContent(content)) {
        return new Promise((resolve, reject) => {
          reject('Attempted to unarchive an object, but the input provided was improperly formatted.')
        })
      }

      content.unarchive()

      return context.state.adapter.updateContent(content)
    },

    setCurrentDocument (context, document) {
      context.commit('setCurrentDocument', document)
    },

    clearCurrentDocument (context) {
      context.commit('setCurrentDocument', null)
    }
  }, // end actions

  mutations: {
    setBackendAdapter (state, adapter) {
      state.adapter = adapter
    },

    setCurrentUser (state, val) {
      state.currentUser = val
    },

    setUserListener (state, func) {
      state.userListener = func
    },

    setContents (state, val) {
      state.contents = val
    },

    setContentsListener (state, val) {
      state.contentsListener = val
    },

    setTrashedItems (state, items) {
      state.trashedItems = items
    },

    setTrashListener (state, func) {
      state.trashListener = func
    },

    setArchiveContents (state, contents) {
      state.archiveContents = contents
    },

    setArchiveListener (state, func) {
      state.archiveListener = func
    },

    setUsername (state, username) {
      state.username = username
    },

    setTargetFolder (state, folderKey) {
      state.sidebarTarget = folderKey
    },

    setBootstrapState (state, val) {
      state.appBootstrapState = val
    },

    setSortDirectionAscending (state) {
      state.sortDirection = 'ascending'
      // TODO Async operations should be in actions, not mutations.
      state.adapter.updateUser({ sortDirection: 'ascending' })
    },

    setSortDirectionDescending (state) {
      state.sortDirection = 'descending'
      state.adapter.updateUser({ sortDirection: 'descending' })
    },

    setSortGroupingFolders (state) {
      state.sortGrouping = 'folders'
      state.adapter.updateUser({ sortGrouping: 'folders' })
    },

    setSortGroupingNone (state) {
      state.sortGrouping = 'none'
      state.adapter.updateUser({ sortGrouping: 'none' })
    },

    setSortByTitle (state) {
      state.sortField = 'title'
      state.adapter.updateUser({ sortField: 'title' })
    },

    setSortByLastUpdated (state) {
      state.sortField = 'updated'
      state.adapter.updateUser({ sortField: 'updated' })
    },

    setFilterTag (state, filterTag) {
      state.filterTag = filterTag
    },

    setEditorObject (state, editor) {
      state.editor = editor
    },

    setSidebarManualOverride (state, val) {
      state.manualOverrideShowSidebar = val
    },

    setIsSavingDocument (state, val) {
      state.isSavingDocument = val
    },

    setTagViewLayout (state, layout) {
      if (!_.includes(['document-tree', 'flat-list', 'grouped-tree'], layout)) {
        return
      }
      state.tagViewLayout = layout
    },

    setCurrentDocument (state, document) {
      state.currentDocument = document
    }
  }
})


export default store
