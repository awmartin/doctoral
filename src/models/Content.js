import util from '@/lib/util'
const _ = require('lodash')

class Content {
  constructor (id, data) {
    this.id = id
    this.update(data)

    // Tag snippets aren't stored in the Content itself on the server.
    this.snippets = []
  }

  get title () { return this._original.title }
  set title (val) { this._original.title = val }
  get type () { return this._original.type }
  get starred () { return this._original.starred || false }
  set starred (val) { this._original.starred = val }
  get trashed () { return this._original.trashed || false }
  set trashed (val) { this._original.trashed = val }
  get key () { return this._original.key || null }
  set key (val) { this._original.key = val }
  get parent () { return this._original.parent || null }
  set parent (val) { this._original.parent = val }
  get created () { return this._original.created }
  get updated () { return this._original.updated }
  set updated (val) { this._original.updated = val }
  get tags () { return this._original.tags || [] }
  set tags (val) { this._original.tags = val }
  get children () { return this._original.children || [] }
  set children (val) { this._original.children = val }
  get archived () { return this._original.archived || false }
  set archived (val) { this._original.archived = val }
  get todos () { return this._original.todos ||[] }
  set todos (val) { this._original.todos = val }

  update (data) {
    this._original = data
    if (_.isNil(data.created)) { this._original.created = new Date() }
    if (_.isNil(data.updated)) { this._original.updated = this.created }
  }

  setId (id) {
    this.id = id
  }

  setChildren (children) {
    this.children = children
  }

  addChild (child) {
    if (!this.canHaveChildren) {
      console.error(`Trying to add a child to a folder that cannot contain anything: ${this.id}`)
      return
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
      todos: this.todos,
    }
  }

  setTags (tagsAndSnippets) {
    this.tags = tagsAndSnippets.tags

    // While snippets are stored here temporarily, they aren't saved to the server
    // in the Content reference, but collectively in the "tags" store.
    this.snippets = tagsAndSnippets.snippets
    this.setUpdated()
  }

  setTodos (todos) {
    this.todos = todos
    this.setUpdated()
  }
}

const newDocument = (title, key = null) => {
  return new Content(null, { title: title || 'Untitled Document', type: 'Document', key })
}

const newFolder = () => {
  return new Content(null, { title: 'An Untitled Folder', type: 'Folder' })
}

const homeFolder = new Content(null, { title: 'Home', type: 'Folder' })

const starredFolder = new Content('STARRED', { title: 'Starred', type: 'Folder' })

// TODO Refactor sidebar view to not use the virtual folder model.

const tagsList = new Content('TAGSLIST', { title: 'Tags', type: 'Folder' })

const allDocumentsFolder = new Content('ALLDOCUMENTS', { title: 'All Documents', type: 'Folder' })

const allFoldersFolder = new Content('ALLFOLDERS', { title: 'All Folders', type: 'Folder' })

const emptyFolder = new Content('EMPTYFOLDER', { title: '', type: 'Folder' })

const archiveFolder = new Content('ARCHIVEFOLDER', { title: 'Archive', type: 'Folder' })

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
