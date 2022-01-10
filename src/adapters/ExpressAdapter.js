import Adapter from '@/adapters/Adapter'
import Content from '@/models/Content'
import Document from '@/models/Document'
import axios from 'axios'
import util from '@/lib/util'

const _ = require('lodash')

class ExpressAdapter extends Adapter {
  registerAuthCallback (onLoggedIn, onNotLoggedIn) {
    this.onLoggedIn = onLoggedIn
    _.noop(onNotLoggedIn)

    setTimeout(this.authenticate.bind(this), 1000)
  }

  authenticate () {
    this.user = {
      name: 'William Martin',
      sortDirection: 'ascending',
      sortGrouping: 'folders',
      sortField: 'title',
      username: 'awmartin'
    }

    this.onLoggedIn(this.user)
  }

  deauthenticate () {

  }

  updateUser (data) {
    this.user = _.defaults(data, this.user)
  }

  registerContentsListener (onUpdate) {
    this.onUpdateContentsCallaback = onUpdate

    const onSuccess = response => {
      const data = response.data

      console.debug('Got data from the backend:', data)

      const contents = _.map(data, datum => {
        const id = datum._id || datum.id
        const content = new Content.Content(id, datum)
        return content
      })

      console.debug('Updating contents with:', contents)
      onUpdate(contents)
    }

    const onError = error => {
      console.error('Error occurred in contents listener:', error)
    }

    axios.get('http://localhost:3000/api/contents', {
      headers: {
        'Content-Type': 'application/json'
      },
      responseType: 'json'
    })
    .then(onSuccess)
    .catch(onError)

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
    return axios.post('http://localhost:3000/api/contents', {}, {
        responseType: 'json'
      })
      .then(response => response.data)
  }

  provisionNewDocumentReference () {
    return axios.post('http://localhost:3000/api/documents', {}, {
        responseType: 'json'
      })
      .then(response => response.data)
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

  _updatePromiseFun (contentToUpdate) {
    if (_.isNil(contentToUpdate)) {
      return util.successPromise(null)
    } else if (_.isNil(contentToUpdate.id)) {
      console.error('Unexpectedly updating a malformed Content instance to update.')
      return util.errorPromise('Unexpectedly updating a malformed Content instance to update.')
    }

    return axios.put(`http://localhost:3000/api/contents/${contentToUpdate.id}`, 
      JSON.stringify(contentToUpdate.toJson()),
      {
        headers: {
          'Content-Type': 'application/json'
        },
        responseType: 'json'
      })
      .then(response => {
        // TODO Audit this approach. Resetting the data given the response seems risky.
        contentToUpdate.update(response.data)
        return contentToUpdate
      })
  }

  updateContent (content, batch_ = null) {
    _.noop(batch_)

    const items = _.isArray(content) ? _.filter(content) : _.filter([content])

    if (_.size(items) === 1) {
      return this._updatePromiseFun(items[0])
    } else if (_.size(items) === 2) {
      return this._updatePromiseFun(items[0])
        .then(() => this._updatePromiseFun(items[1]))
    } else if (_.size(items) === 3) {
      return this._updatePromiseFun(items[0])
        .then(() => this._updatePromiseFun(items[1]))
        .then(() => this._updatePromiseFun(items[2]))
    }
  }

  createDocument (document, parent) {
    return this.updateContent([document.content, parent])
      .then(() => {
        return this.updateDocument(document)
      })
      .then(() => {
        this.registerContentsListener(this.onUpdateContentsCallaback)
        return document
      })
  }

  updateDocument (document) {
    return axios.put(`http://localhost:3000/api/documents/${document.id}`,
      JSON.stringify(document.toJson()),
      {
        headers: {
          'Content-Type': 'application/json'
        },
        responseType: 'json'
      })
      .then(response => {
        document.update(response.data)
        return document
      })
      .then(doc => {
        _.noop(doc)
        return this.updateContent(document.content)
      })
      .then(con => {
        _.noop(con)
        // When saving a document, update the corresponding tags this document references.
        return this.updateTagSnippets(document.content)
      })
  }

  loadDocument (documentKey) {
    return axios.get(`http://localhost:3000/api/documents/${documentKey}`,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        responseType: 'json'
      })
      .then(response => {
        const data = response.data
        const id = data._id || data.id
        const document = new Document.Document(id, data)
        return document
      })
  }

  publishDocument (document, slug) {
    const url = `http://localhost:3000/api/documents/${document.id}/publish`
    return axios.post(url,
      { 'slug': slug },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        responseType: 'json'
      })
      .then(response => response.data)
  }

  _deletePromiseFun (toDelete) {
    const model = Document.isDocument(toDelete) ? 'documents' : 'contents'
    const url = `http://localhost:3000/api/${model}/${toDelete.id}`
    
    return axios.delete(url, {
        headers: {
          'Content-Type': 'application/json'
        },
        responseType: 'json'
      })
  }

  delete (items) {
    let queue = Promise.resolve()

    _.forEach(items, item => {
      if (item.operation === 'DELETE') {
        // Delete the folder or document reference.

        queue = queue.then(() => {
          return this._deletePromiseFun(item.content)
        })

        if (item.content.isDocument) {
          // Delete the document itself.

          queue = queue.then(() => {
            // Create a mock document instance as a reference for what to delete
            // in the documents data store.
            const mockDocument = {
              id: item.content.key,
              title: item.content.title,
              body: '', // Stub string
            }

            this._deletePromiseFun(mockDocument)
          })
        }
      } else if (item.operation === 'UPDATE') {
        // Update the given content. Typically for removing a child from a folder.

        queue = queue.then(() => {
          return this._updatePromiseFun(item.content)
        })
      }
    })

    return queue.then(() => {
      return this.registerContentsListener(this.onUpdateContentsCallaback)
    })
  }

  loadTagSnippets (hashtag) {
    const tag = _.trimStart(hashtag, '#')
    return axios.get(`http://localhost:3000/api/tags/${tag}`,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        responseType: 'json'
      })
      .then(response => response.data)
  }

  updateTagSnippets (content, batch_ = null) {
    _.noop(batch_)
    if (_.isNil(content.snippets)) { return null }

    // Produce the payload that combines all the tag snippets together.
    const data = {}

    _.forEach(content.snippets, (snippets, hashtag) => {
      const tr = {}
      tr[content.id] = JSON.stringify(snippets)
      data[hashtag] = tr
    })
  
    return axios.put(`http://localhost:3000/api/tags`,
      data,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        responseType: 'json'
      })
  }
}

export default ExpressAdapter
