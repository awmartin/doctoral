const _ = require('lodash')

class Document {
  constructor (title, body, id = null, created = null, updated = null, content = null) {
    this.title = title
    this.body = body

    this.id = id
    this.created = created || new Date()
    this.updated = updated || new Date()

    this.content = content
  }

  setId (id) {
    this.id = id
  }

  setTableOfContentsReference (content) {
    this.content = content
  }

  setTitle (newTitle) {
    this.title = _.trim(newTitle)
    this.updated = new Date()
  }

  setBody (newBody) {
    this.body = newBody
    this.updated = new Date()
  }

  setUpdated () {
    this.updated = new Date()
  }
}

const isDocument = _.conforms({
  id: _.isString,
  title: _.isString,
  body: _.isString,
  updated: _.isDate
})

const newDocument = () => {
  return new Document('Untitled Document', '')
}

export default {
  Document,
  isDocument,
  new: newDocument
}
