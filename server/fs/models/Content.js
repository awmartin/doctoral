const _ = require('lodash')
const shortid = require('shortid')

const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_~'
shortid.characters(chars)

class Content {
  constructor (data) {
    this.id = _.isString(data.id) ? data.id : shortid.generate()

    this.title = data.title
    this.type = data.type
    this.key = _.isString(data.key) ? data.key : null

    this.trashed = _.isNil(data.trashed) ? false : data.trashed
    this.starred = _.isNil(data.starred) ? false : data.starred

    this.created = _.isNil(data.created) ? new Date() : new Date(data.created)
    this.updated = _.isNil(data.updated) ? new Date() : new Date(data.updated)

    this.children = _.isNil(data.children) ? [] : data.children
  }

  toJson () {
    return {
      title: this.title,
      type: this.type,
      id: this.id,
      key: this.key,
      trashed: this.trashed,
      starred: this.starred,
      created: this.created.toISOString(),
      updated: this.updated.toISOString(),
      children: this.children
    }
  }
}

module.exports = Content
