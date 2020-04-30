import Content from '@/models/Content'
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

    if (_.isNil(this.content.key)) {
      this.content.setKey(this.id)
    }
  }

  setTableOfContentsReference (content) {
    this.content = content
    this.content.setKey(this.id)
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
}

const isDocument = _.conforms({
  id: _.isString,
  title: _.isString,
  body: _.isString,
  updated: _.isDate
})

const newDocument = () => {
  const content = Content.newDocument('Untitled Document')
  const document = new Document('Untitled Document', '')
  document.setTableOfContentsReference(content)
  return document
}

export default {
  Document,
  isDocument,
  new: newDocument
}
