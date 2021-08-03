import Content from '@/models/Content'
const _ = require('lodash')

class FileUploader {
  constructor (backend) {
    this.backend = backend

    this.fileRef = null
  }

  uploadFile (file, parent) {
    return this.backend.provisionNewContentReference()
      .then(newContentRef => {
        this.fileRef = newContentRef
        return this.backend.uploadFileForDocument(file, this.storagePathObj)
      })
      .then(url => {
        const content = this.createContentFromFile(file, parent, url)
        return this.backend.createContent(content, parent)
      })
      .catch(error => {
        console.error('File upload failed', error)
      })
  }

  get storagePathObj () {
    // HACK This currently stands in as a Document object, but the id is the only field accessed.
    return { id: 'files' }
  }

  get fileContentId () {
    return this.fileRef ? this.fileRef.id : null
  }

  createContentFromFile (file, parent, url) {
    if (_.isNil(this.fileContentId)) {
      throw "Attempted to create a Content object for a File upload without a Content id."
    }

    return new Content.Content(
      file.name,
      'File', // type
      false, // starred
      false, // trashed
      this.fileContentId, // id
      url, // key
      parent.id, // parent
    )
  }
}

export default FileUploader
