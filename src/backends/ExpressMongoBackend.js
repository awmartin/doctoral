import Content from '@/models/Content'
import Document from '@/models/Document'

const _ = require('lodash')
const $ = require('jquery')

class ExpressBackend {
  constructor (config) {
    this.config = config || _.stubObject

    this.onLoggedIn = null

    this.user = {
      name: 'William Martin',
      sortDirection: 'ascending',
      sortGrouping: 'folders',
      sortField: 'title',
      username: 'awmartin'
    }
  }

  registerAuthCallback (onLoggedIn, onNotLoggedIn) {
    this.onLoggedIn = onLoggedIn
    _.noop(onNotLoggedIn)

    setTimeout(this.authorize.bind(this), 1000)
  }

  authorize () {
    this.onLoggedIn(this.user)
  }

  deauthorize () {

  }

  getCurrentUser () {
    return this.user
  }

  updateUser (data) {
    this.user = _.defaults(data, this.user)
  }

  registerContentsListener (onUpdate) {
    this.onUpdateContentsCallaback = onUpdate

    const onError = (xhr, status, error) => {
      console.error('Error occurred in contents listener:', error)
    }

    $.ajax({
      url: 'http://localhost:3000/api/contents',
      method: 'GET',
      dataType: 'json',
      cache: false, // TODO Check on this.
      success: data => {
        console.debug('Got data from the backend:', data)

        const contents = _.map(data, datum => {
          const content = new Content.Content(
            datum.title,
            datum.type,
            datum.starred,
            datum.trashed,
            datum._id,
            datum.key,
            datum.parent
          )

          content.setChildren(datum.children)

          return content
        })

        console.debug('Updating contents with:', contents)
        onUpdate(contents)
      },
      error: onError
    })

    return _.noop
  }

  registerTrashListener (onUpdate) {
    onUpdate([])
  }

  registerUserStateListener (onUpdate) {
    onUpdate(this.user)
  }

  provisionNewContentReference () {
    // Creates the content reference. createContent will then update it.
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `http://localhost:3000/api/contents`,
        method: 'POST',
        dataType: 'json',
        data: {},
        success: datum => {
          resolve({ id: datum._id })
        },
        error: reject
      })
    })
  }

  provisionNewDocumentReference () {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `http://localhost:3000/api/documents`,
        method: 'POST',
        dataType: 'json',
        data: {},
        success: datum => {
          resolve({ id: datum._id })
        },
        error: reject
      })
    })
  }

  createContent (content, parent, batch_ = null) {
    _.noop(batch_)

    if (_.isNil(parent)) {
      return this.updateContent(content).then(() => {
        // Request all the contents again.
        this.registerContentsListener(this.onUpdateContentsCallaback)
        return content
      })
    } else {
      return this.updateContent(parent)
        .then(() => {
          return this.updateContent(content)
        })
        .then(() => {
          this.registerContentsListener(this.onUpdateContentsCallaback)
          return content
        })
    }
  }

  updatePromiseFun (contentToUpdate) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `http://localhost:3000/api/contents/${contentToUpdate.id}`,
        method: 'PUT',
        dataType: 'json',
        data: contentToUpdate.toJson(),
        success: datum => {
          const newContent = new Content.Content(
            datum.title,
            datum.type,
            datum.starred,
            datum.trashed,
            datum._id,
            datum.key,
            datum.parent
          )

          newContent.setChildren(datum.children)

          resolve(newContent)
        },
        error: reject
      })
    })
  }

  updateContent (content, batch_ = null) {
    _.noop(batch_)

    const items = _.isArray(content) ? _.filter(content) : _.filter([content])

    if (_.size(items) === 1) {
      return this.updatePromiseFun(items[0])
    } else if (_.size(items) === 2) {
      return this.updatePromiseFun(items[0])
        .then(() => this.updatePromiseFun(items[1]))
    } else if (_.size(items) === 3) {
      return this.updatePromiseFun(items[0])
        .then(() => this.updatePromiseFun(items[1]))
        .then(() => this.updatePromiseFun(items[2]))
    }
  }

  createDocument (document, parent) {
    if (_.isNil(parent)) {
      return this.updateDocument(document).then(() => {
        this.registerContentsListener(this.onUpdateContentsCallaback)
        return document
      })
    } else {
      return this.updateContent(parent)
        .then(() => {
          return this.updateDocument(document)
        })
        .then(() => {
          this.registerContentsListener(this.onUpdateContentsCallaback)
          return document
        })
    }
  }

  updateDocument (document) {
    const docUpdate = new Promise((resolve, reject) => {
      $.ajax({
        url: `http://localhost:3000/api/documents/${document.id}`,
        method: 'PUT',
        dataType: 'json',
        data: document.toJson(),
        success: data => {
          const document = new Document.Document(data.title, data.body, data._id)
          resolve(document)
        },
        error: reject
      })
    })

    return docUpdate.then(() => {
      return this.updateContent(document.content)
    })
  }

  loadDocument (documentKey) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `http://localhost:3000/api/documents/${documentKey}`,
        method: 'GET',
        dataType: 'json',
        success: data => {
          const document = new Document.Document(data.title, data.body, data._id)
          resolve(document)
        },
        error: reject
      })
    })
  }

  publishDocument (document, slug) {
    _.noop(document, slug)
  }

  deletePromiseFun (toDelete) {
    const model = Document.isDocument(toDelete) ? 'documents' : 'contents'
    const url = `http://localhost:3000/api/${model}/${toDelete.id}`
    
    return new Promise((resolve, reject) => {
      $.ajax({
        url,
        method: 'DELETE',
        dataType: 'json',
        success: resolve,
        error: reject
      })
    })
  }

  delete (items) {
    let queue = Promise.resolve()

    _.forEach(items, item => {
      if (item.operation === 'DELETE') {
        // Delete the folder or document reference.

        queue = queue.then(() => {
          return this.deletePromiseFun(item.content)
        })

        if (item.content.isDocument()) {
          // Delete the document itself.

          queue = queue.then(() => {
            const document = {
              id: item.content.key,
              title: item.content.title,
              body: '', // Stub string
              updated: item.content.updated
            }

            this.deletePromiseFun(document)
          })
        }
      } else if (item.operation === 'UPDATE') {
        // Update the given content. Typically for removing a child from a folder.

        queue = queue.then(() => {
          return this.updatePromiseFun(item.content)
        })
      }
    })

    return queue.then(() => {
      return this.registerContentsListener(this.onUpdateContentsCallaback)
    })
  }
}

export default ExpressBackend
