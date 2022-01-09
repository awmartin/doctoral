const _ = require('lodash')
const shortid = require('shortid')
const prettier = require('prettier')

const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_~'
shortid.characters(chars)

function getTitleUrl (title) {
  const trimTitle = _.trim(title)
  const titleForUrl = _.replace(trimTitle, /[^a-zA-Z0-9]/g, '-')
  const sanitizedTitleUrl = _.replace(titleForUrl, /[-]{1,}/g, '-')
  const titleUrl = _.trim(sanitizedTitleUrl, '-')
  return titleUrl
}

class Document {
  constructor (data) {
    this.id = _.isString(data.id) ? data.id : shortid.generate()

    this.title = _.isString(data.title) ? data.title : ''
    this.content = _.isString(data.content) ? data.content : ''

    this.created = _.isNil(data.created) ? new Date() : new Date(data.created)
    this.updated = _.isNil(data.updated) ? new Date() : new Date(data.updated)
  }

  toJson () {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      created: this.created.toISOString(),
      updated: this.updated.toISOString()
    }
  }

  get body () { return this.content || "" }
  set body (val) { this.content = val }

  toHtml () {
    const prettyBody = prettier.format(this.body, { parser: 'html' })
    const prettyCreated = this.created.toISOString()
    const prettyUpdated = this.updated.toISOString()

    return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
  
      <title>${this.title}</title>
      <meta name="created" content="${prettyCreated}">
      <meta name="updated" content="${prettyUpdated}">

      <link rel="stylesheet" href="https://firebasestorage.googleapis.com/v0/b/doctoral-460ba.appspot.com/o/public%2Fpublished.css?alt=media">
    </head>
  
    <body>
      <h1>${this.title}</h1>

      <main class="content">
      ${prettyBody}
      </main>
    </body>
  </html>
`
  }

  filename () {
    if (_.isEmpty(this.title)) {
      return `${this.id}.json`
    } else {
      const titleUrl = getTitleUrl(this.title)
      return `${this.id}-${titleUrl}.json`
    }
  }
}

module.exports = Document
