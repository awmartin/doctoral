import util from '@/lib/util'
const _ = require('lodash')

class Content {
  constructor (title, type, starred = false, trashed = false, id = null, key = null, parent = null, created = null, updated = null) {
    this.title = title
    this.type = type

    this.trashed = trashed
    this.starred = starred

    this.id = id
    this.key = key
    this.parent = parent

    this.created = created || new Date()
    this.updated = updated || this.created

    this.children = []
  }

  setId (id) {
    this.id = id
  }

  setChildren (children) {
    this.children = children
  }

  addChild (child) {
    if (_.isString(child) && !_.includes(this.children, child)) {
      this.children.push(child)
      this.setUpdated()
    } else if (_.isObject(child) && !_.includes(this.children, child.id)) {
      this.children.push(child.id)
      child.setParent(this.id)
      this.setUpdated()
    }
  }

  removeChild (child) {
    _.pull(this.children, child)
    this.setUpdated()
  }

  setTitle (newTitle) {
    this.title = newTitle
    this.setUpdated()
  }

  isDocument () {
    return this.type === 'Document'
  }

  isFolder () {
    return this.type === 'Folder'
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
    const titleUrl = util.getTitleUrl(this.title)
    return `${this.key}-${titleUrl}`
  }
}

const newDocument = (title, key) => {
  return new Content(title || 'Untitled Document', 'Document', false, false, null, key)
}

const newFolder = () => {
  return new Content('An Untitled Folder', 'Folder')
}

const starredFolder = new Content('Starred', 'Folder', false, false, 'STARRED')

const homeFolder = new Content('Home', 'Folder', false, false, null)

const isContent = _.conforms({
  id: _.isString,
  'type': t => t === 'Folder' || t === 'Document'
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

export default {
  Content,
  isContent,
  isContentForFolder,
  isContentForDocument,
  newDocument,
  newFolder,
  starredFolder,
  homeFolder
}
