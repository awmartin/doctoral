const DEFAULT_ROOT_FOLDER_RELATIVE = './data'

class FileSystemConfig {
  constructor (rootFolder, publishFolder) {
    this.rootFolder = rootFolder || process.env.ROOT_FOLDER || DEFAULT_ROOT_FOLDER_RELATIVE
    this.publishFolder = publishFolder || process.env.PUBLISH_FOLDER || this.rootFolder
  }
}

module.exports = FileSystemConfig
