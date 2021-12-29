const Document = require('../models/Document')
const _ = require('lodash')
const glob = require('glob')
const fs = require('fs')

class FileSystemDocumentsController {
  constructor (config) {
    this.config = config
  }

  get rootFolder () {
    return this.config.rootFolder
  }

  get publishFolder () {
    return this.config.publishFolder
  }

  getDocument (req, res) {
    const documentId = req.params.id
    console.debug('Getting document:', documentId)

    glob(`${this.rootFolder}/${documentId}*.json`, null, (err, filenames) => {
      if (err) {
        console.error(err.toString())
        res.status(500)
      } else if (_.size(filenames)) {
        const filename = _.head(filenames)

        fs.readFile(filename, (err, data) => {
          if (err) {
            console.error(err.toString())
            res.status(500)
          } else {
            const documentData = JSON.parse(data)
            res.json(documentData)
          }
        })
      }
    }) // end glob
  }

  createDocument (req, res) {
    console.log("Attempting to create a new document object.")

    const newDocument = new Document(req.body)
    const fileContents = JSON.stringify(newDocument.toJson(), null, '  ')
    const filename = newDocument.filename()

    fs.writeFile(`${this.rootFolder}/${filename}`, fileContents, err => {
      if (err) {
        console.error(err.toString())
        res.status(500)
      } else {
        res.json(newDocument.toJson())
      }
    })
  }

  updateDocument (req, res) {
    const documentId = req.params.id
    console.log(`Updating document ${documentId}.`)

    glob(`${this.rootFolder}/${documentId}*.json`, null, (err, filenames) => {
      if (err) {
        console.error(err.toString())
        res.status(500)
      } else if (_.size(filenames)) {
        const filename = _.head(filenames)

        fs.readFile(filename, (err, data) => {
          if (err) {
            console.error(err.toString())
            res.status(500)
          } else {
            const documentData = JSON.parse(data)

            const expectedFields = ['title', 'body', 'created', 'updated']
            _.forEach(expectedFields, field => {
              if (_.has(req.body, field)) {
                const value = req.body[field]
                documentData[field] = value
              }
            })

            const fileContents = JSON.stringify(documentData, null, '  ')
            fs.writeFile(filename, fileContents, err => {
              if (err) {
                console.error(err.toString())
                res.status(500)
              } else {
                // Attempt to rename the file if necessary.

                const document = new Document(documentData)
                const newFilename = document.filename()
                if (newFilename !== filename) {
                  fs.renameSync(filename, `${this.rootFolder}/${newFilename}`)
                }

                res.send(documentData)
              }
            }) // end write
          }
        }) // end read
      } else {
        console.error(`Document ${documentId} not found.`)
        res.status(404)
      }
    }) // end glob find
  }

  deleteDocument (req, res) {
    const documentId = req.params.id
    console.log('Deleting document:', documentId)

    glob(`${this.rootFolder}/${documentId}*.json`, null, (err, filenames) => {
      if (err) {
        console.error(err.toString())
        res.status(500)
      } else if (_.size(filenames)) {
        const filename = _.head(filenames)
        fs.unlink(filename, err => {
          if (err) {
            console.error(err.toString())
            res.status(500)
          } else {
            res.status(200)
          }
        }) // unlink delete
      }
    }) // end glob find
  }

  publishDocument (req, res) {
    const documentId = req.params.id
    const slug = req.body.slug
    console.log(`Publishing document ${documentId} to ${slug}.html.`)

    glob(`${this.rootFolder}/${documentId}*.json`, null, (err, filenames) => {
      if (err) {
        console.error(err.toString())
        res.status(500)
      } else if (_.size(filenames)) {
        const filename = _.head(filenames)

        fs.readFile(filename, (err, data) => {
          if (err) {
            console.error(err.toString())
            res.status(500)
          } else {
            const documentData = JSON.parse(data)
            const document = new Document(documentData)
            fs.writeFileSync(`${publishFolder}/${slug}.html`, document.toHtml())
            res.status(200)
            res.send(`Published ${slug}.`)
          }
        }) // end read document json
      }
    }) // end glob find
  }
}

module.exports = FileSystemDocumentsController
