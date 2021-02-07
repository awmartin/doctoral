import Content from '@/models/Content'
import Document from '@/models/Document'
import axios from 'axios'

const _ = require('lodash')

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

    const onSuccess = response => {
      const data = response.data

      console.debug('Got data from the backend:', data)

      const contents = _.map(data, datum => {
        const content = new Content.Content(
          datum.title,
          datum.type,
          datum.starred,
          datum.trashed,
          datum._id || datum.id,
          datum.key,
          datum.parent,
          null,
          null,
          datum.tags,
          datum.archived
        )

        content.setChildren(datum.children)

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
    return new Promise((resolve, reject) => {
      axios.post('http://localhost:3000/api/contents', {}, {
          responseType: 'json'
        })
        .then(response => resolve(response.data))
        .catch(reject)
    })
  }

  provisionNewDocumentReference () {
    return new Promise((resolve, reject) => {
      axios.post('http://localhost:3000/api/documents', {}, {
          responseType: 'json'
        })
        .then(response => resolve(response.data))
        .catch(reject)
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
      const onSuccess = response => {
        const datum = response.data
  
        const newContent = new Content.Content(
          datum.title,
          datum.type,
          datum.starred,
          datum.trashed,
          datum._id || datum.id,
          datum.key,
          datum.parent,
          null,
          null,
          datum.tags,
          datum.archived
        )

        newContent.setChildren(datum.children)

        resolve(newContent)
      }

      return axios.put(`http://localhost:3000/api/contents/${contentToUpdate.id}`, 
        JSON.stringify(contentToUpdate.toJson()),
        {
          headers: {
            'Content-Type': 'application/json'
          },
          responseType: 'json'
        })
        .then(onSuccess)
        .catch(reject)
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
    const docUpdate = new Promise((resolve, reject) => {
      const onSuccess = response => {
        const data = response.data
        const document = new Document.Document(data.title, data.body, data._id || data.id)
        resolve(document)
      }

      axios.put(`http://localhost:3000/api/documents/${document.id}`,
        JSON.stringify(document.toJson()),
        {
          headers: {
            'Content-Type': 'application/json'
          },
          responseType: 'json'
        })
        .then(onSuccess)
        .catch(reject)
    })

    return docUpdate.then(() => {
      return this.updateContent(document.content)
    }).then(content => {
      _.noop(content)
      return this.updateTagSnippets(document.content)
    })
  }

  loadDocument (documentKey) {
    return new Promise((resolve, reject) => {
      const onSuccess = response => {
        const data = response.data
        const document = new Document.Document(data.title, data.body, data._id || data.id)
        resolve(document)
      }

      axios.get(`http://localhost:3000/api/documents/${documentKey}`,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        responseType: 'json'
      })
      .then(onSuccess)
      .catch(reject)
    })
  }

  publishDocument (document, slug) {
    const url = `http://localhost:3000/api/documents/${document.id}/publish`

    return new Promise((resolve, reject) => {
      axios.post(url,
        { 'slug': slug },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          responseType: 'json'
        })
        .then(response => resolve(response.data))
        .catch(reject)
    })
  }

  deletePromiseFun (toDelete) {
    const model = Document.isDocument(toDelete) ? 'documents' : 'contents'
    const url = `http://localhost:3000/api/${model}/${toDelete.id}`
    
    return new Promise((resolve, reject) => {
      axios.delete(url, {
        headers: {
          'Content-Type': 'application/json'
        },
        responseType: 'json'
      })
      .then(resolve)
      .catch(reject)
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

        if (item.content.isDocument) {
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

  loadTagSnippets (hashtag) {
    console.debug('hashtag', hashtag)
    return new Promise((resolve, reject) => {
      const onSuccess = response => {
        resolve(response.data)
      }

      const tag = _.trimStart(hashtag, '#')
      axios.get(`http://localhost:3000/api/tags/${tag}`,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        responseType: 'json'
      })
      .then(onSuccess)
      .catch(reject)
    })
  }

  updateTagSnippets (content, batch_ = null) {
    _.noop(batch_)
    if (_.isNil(content.snippets)) { return null }

    return new Promise((resolve, reject) => {
      const data = {}

      _.forEach(content.snippets, (snippets, hashtag) => {
        const tr = {}
        tr[content.id] = JSON.stringify(snippets)
        data[hashtag] = tr
      })
  
      axios.put(`http://localhost:3000/api/tags`,
        data,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          responseType: 'json'
        })
        .then(resolve)
        .catch(reject)
    })
  }
}

export default ExpressBackend
