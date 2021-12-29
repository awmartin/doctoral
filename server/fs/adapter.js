const FileSystemContentsController = require('./controllers/contents')
const FileSystemDocumentsController = require('./controllers/documents')
const FileSystemTagsController = require('./controllers/tags')

class FileSystemAdapter {
  constructor (config, app) {
    this.config = config
    this.app = app
  }

  start () {
    this.contentsController = new FileSystemContentsController(this.config)
    this.app.get('/api/contents', this.contentsController.getAllContents.bind(this.contentsController))
    this.app.post('/api/contents', this.contentsController.createContent.bind(this.contentsController))
    this.app.put('/api/contents/:id', this.contentsController.updateContent.bind(this.contentsController))
    this.app.delete('/api/contents/:id', this.contentsController.deleteContent.bind(this.contentsController))

    this.documentsController = new FileSystemDocumentsController(this.config)
    this.app.get('/api/documents/:id', this.documentsController.getDocument.bind(this.documentsController))
    this.app.post('/api/documents', this.documentsController.createDocument.bind(this.documentsController))
    this.app.put('/api/documents/:id', this.documentsController.updateDocument.bind(this.documentsController))
    this.app.delete('/api/documents/:id', this.documentsController.deleteDocument.bind(this.documentsController))
    this.app.post('/api/documents/:id/publish', this.documentsController.publishDocument.bind(this.documentsController))

    this.tagsController = new FileSystemTagsController(this.config)
    this.app.put('/api/tags', this.tagsController.updateTagSnippets.bind(this.tagsController))
    this.app.get('/api/tags/:id', this.tagsController.loadTagSnippets.bind(this.tagsController))
  }
}

module.exports = FileSystemAdapter
