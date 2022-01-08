import Content from '@/models/Content'
import util from '@/lib/util'
const _ = require('lodash')

class Document {
  // constructor (title, body, id = null, created = null, updated = null, content = null, fullwidth = false) {
  constructor (id, data, content) {
    this.id = id
    this.content = content // The Content instance the represents this Document in the Table-of-Contents.

    this.update(data)
  }

  get title () { return this._original.title }
  set title (val) { this._original.title = val }
  get body () { return this._original.body }
  set body (val) { this._original.body = val }
  get created () { return this._original.created }
  set created (val) { this._original.created = val }
  get updated () { return this._original.updated }
  set updated (val) { this._original.updated = val }
  get fullwidth () { return this._original.fullwidth || false }
  set fullwidth (val) { this._original.fullwidth = val }

  update (data) {
    this._original = data
    if (_.isNil(this._original.created)) { this._original.created = new Date() }
    if (_.isNil(this._original.updated)) { this._original.updated = this.created }
  }

  setId (id) {
    this.id = id

    if (_.isObject(this.content)) {
      this.content.setKey(this.id)
    }
  }

  setTableOfContentsReference (content) {
    if (content.key !== this.id) {
      console.error("Can't set a content on a document that doesn't share the same key.")
    } else {
      this.content = content
    }
  }

  setTitle (newTitle) {
    this.title = newTitle
    this.setUpdated()

    this.content.setTitle(newTitle)
  }

  setBody (newBody) {
    this.body = newBody
    this.setUpdated()
  }

  setUpdated () {
    this.updated = new Date()
  }

  urlId () {
    const titleUrl = util.getTitleUrl(this.title)
    return `${this.id}-${titleUrl}`
  }

  trash () {
    this.content.trash()
  }

  archive () {
    this.content.archive()
  }

  unarchive () {
    this.content.unarchive()
  }

  star () {
    this.content.star()
  }

  isStarred () {
    return this.content.starred
  }

  setFullWidth () {
    this.fullwidth = true
  }

  setNormalWidth () {
    this.fullwidth = false
  }

  toJson() {
    return {
      title: this.title,
      body: this.body,
      created: this.created,
      updated: this.updated
    }
  }
}

const isDocument = _.conforms({
  id: _.isString,
  title: _.isString,
  body: _.isString
})

const newDocument = () => {
  const content = Content.newDocument('Untitled Document')
  const document = new Document(null, { title: 'Untitled Document', body: '' }, content)
  return document
}

export default {
  Document,
  isDocument,
  new: newDocument
}
