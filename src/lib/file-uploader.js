import Content from '@/models/Content'
const _ = require('lodash')

class FileUploader {
  /**
   * 
   * @param {Adapter} adapter - The backend adapter that will handle the upload.
   */
  constructor (adapter) {
    // Reference to the current backend adapter.
    this.adapter = adapter
    // Reference to the Content object representing the file to be uploaded.
    this.fileRef = null
  }

  /**
   * Invoke the upload process.
   * 
   * @param {File} file - File object to upload.
   * @param {Content} parent - The parent Content instance to hold the file upload.
   * @returns nothing
   */
  uploadFile (file, parent) {
    return this.adapter.provisionNewContentReference()
      .then(newContentRef => {
        this.fileRef = newContentRef
        return this.adapter.uploadFileForDocument(file, this.storagePathObj(parent))
      })
      .then(url => {
        const content = this.createContentFromFile(file, parent, url)
        return this.adapter.createContent(content, parent)
      })
      .catch(error => {
        console.error('File upload failed', error)
      })
  }

  storagePathObj (parent) {
    // HACK This currently stands in as a Document object, but the id is the only field accessed.
    // Files are stored under a parent Content item. Sometimes this is a Document, which can
    // hold several images. Sometimes this is a Folder, when the user uploads to a Sidebar.
    // The folder title is the ID of the parent Content item.
    const id = parent.id || 'home'
    return { id }
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
