import util from '@/lib/util'
const _ = require('lodash')

class Content {
  constructor (title, type, starred = false, trashed = false, id = null, key = null, parent = null, created = null, updated = null, tags = [], archived = false, todos = []) {
    this.title = title
    this.type = type

    this.starred = starred
    this.trashed = trashed

    this.id = id
    this.key = key
    this.parent = parent

    this.created = created || new Date()
    this.updated = updated || this.created

    this.tags = tags
    this.snippets = null

    this.children = []
    this.archived = _.isBoolean(archived) ? archived : false

    this.todos = todos
  }

  setId (id) {
    this.id = id
  }

  setChildren (children) {
    this.children = children
  }

  addChild (child) {
    if (!this.canHaveChildren) {
      throw new Error(`Trying to add a child to a folder that cannot contain anything: ${this.id}`)
    }

    if (_.isString(child)) {
      this.children = util.pushUniq(this.children, child)
      this.setUpdated()
    } else if (_.isObject(child)) {
      this.children = util.pushUniq(this.children, child.id)
      child.setParent(this.id)
      this.setUpdated()
    }
  }

  removeChild (child) {
    if (_.isString(child)) {
      _.pull(this.children, child)
    } else if (isContent(child)) {
      _.pull(this.children, child.id)
      child.setParent(null)
    }

    this.setUpdated()
  }

  setTitle (newTitle) {
    this.title = newTitle
    this.setUpdated()
  }

  get isDocument () {
    return this.type === 'Document'
  }

  get isFolder () {
    return this.type === 'Folder'
  }

  get isFile () {
    return this.type === 'File'
  }

  get isTag () {
    return this.type === 'Tag'
  }

  get isHomeFolder () {
    return _.isNil(this.id)
  }

  get isStarredFolder () {
    return this.id === 'STARRED' && this.isFolder
  }

  get isAllDocumentsFolder () {
    return this.id === 'ALLDOCUMENTS' && this.isFolder
  }

  get isAllFoldersFolder () {
    return this.id === 'ALLFOLDERS' && this.isFolder
  }

  get isTagsListFolder () {
    return this.id === 'TAGSLIST' && this.isFolder
  }

  get isEmptyFolder () {
    return this.id === 'EMPTYFOLDER' && this.isFolder
  }

  get isArchiveFolder () {
    return this.id === 'ARCHIVEFOLDER' && this.isFolder
  }

  get canHaveChildren () {
    return !this.isAllDocumentsFolder && !this.isAllFoldersFolder && !this.isTagsListFolder && !this.isEmptyFolder
  }

  get isEditable () {
    return !this.isAllDocumentsFolder && !this.isAllFoldersFolder && !this.isTagsListFolder && !this.isHomeFolder && !this.isEmptyFolder
  }

  get hasChildren () {
    if (!this.canHaveChildren) { return false }
    return _.size(this.children) > 0
  }

  setKey (key) {
    this.key = key
  }

  trash () {
    this.trashed = true
    this.setUpdated()
  }

  restore () {
    this.trashed = false
    this.setUpdated()
  }

  archive () {
    this.archived = true
    this.setUpdated()
  }

  unarchive () {
    this.archived = false
    this.setUpdated()
  }

  star () {
    this.starred = true
    this.setUpdated()
  }

  unstar () {
    this.starred = false
    this.setUpdated()
  }

  toggleStar () {
    this.starred = !this.starred
    this.setUpdated()
  }

  setParent (parentId) {
    this.parent = parentId
    this.setUpdated()
  }

  setUpdated () {
    this.updated = new Date()
  }

  urlId () {
    if (this.isDocument) {
      const titleUrl = util.getTitleUrl(this.title)
      return `${this.key}-${titleUrl}`
    } else if (this.isTag) {
      return _.trimStart(this.id, '#')
    } else if (this.isFile) {
      return this.id
    } else {
      return ''
    }
  }

  toJson () {
    return {
      title: this.title,
      type: this.type,
      starred: this.starred,
      trashed: this.trashed,
      key: this.key,
      parent: this.parent,
      children: this.children,
      created: this.created,
      updated: this.updated,
      tags: this.tags,
      archived: this.archived,
      todos: this.todos
    }
  }

  setTags (tagsAndSnippets) {
    this.tags = tagsAndSnippets.tags
    this.snippets = tagsAndSnippets.snippets
    this.setUpdated()
  }

  setTodos (todos) {
    this.todos = todos
    this.setUpdated()
  }
}

const newDocument = (title, key = null) => {
  return new Content(title || 'Untitled Document', 'Document', false, false, null, key)
}

const newFolder = () => {
  return new Content('An Untitled Folder', 'Folder')
}

const homeFolder = new Content('Home', 'Folder', false, false, null)

const starredFolder = new Content('Starred', 'Folder', false, false, 'STARRED')

// TODO Refactor sidebar view to not use the virtual folder model.

const tagsList = new Content('Tags', 'Folder', false, false, 'TAGSLIST')

const allDocumentsFolder = new Content('All Documents', 'Folder', false, false, 'ALLDOCUMENTS')

const allFoldersFolder = new Content('All Folders', 'Folder', false, false, 'ALLFOLDERS')

const emptyFolder = new Content('', 'Folder', false, false, 'EMPTYFOLDER')

const archiveFolder = new Content('Archive', 'Folder', false, false, 'ARCHIVEFOLDER')

const isContent = _.conforms({
  id: _.isString,
  'type': t => t === 'Folder' || t === 'Document' || t === 'File'
})

const isContentForFolder = _.conforms({
  id: _.isString,
  'type': t => t === 'Folder'
})

const isContentForDocument = _.conforms({
  id: _.isString,
  'type': t => t === 'Document',
  key: _.isString
})

const isContentForFile = _.conforms({
  id: _.isString,
  'type': t => t === 'File',
  key: _.isString
})

function isHomeFolder (content) {
  return _.isNil(content) || (_.isObject(content) && _.isNil(content.id))
}

export default {
  Content,
  isContent,
  isContentForFolder,
  isContentForDocument,
  isContentForFile,
  newDocument,
  newFolder,
  starredFolder,
  homeFolder,
  tagsList,
  isHomeFolder,
  allDocumentsFolder,
  allFoldersFolder,
  emptyFolder,
  archiveFolder
}
