const Document = require('../models/Document')
const _ = require('lodash')
const glob = require('glob')
const fs = require('fs')

const dataFolder = './data'
const publishFolder = process.env.PUBLISH_FOLDER || dataFolder

function getDocument (req, res) {
  const documentId = req.params.id
  console.debug('Getting document:', documentId)

  glob(`${dataFolder}/${documentId}*.json`, null, (err, filenames) => {
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

function createDocument (req, res) {
  console.log("Attempting to create a new document object.")

  const newDocument = new Document(req.body)
  const fileContents = JSON.stringify(newDocument.toJson(), null, '  ')
  const filename = newDocument.filename()

  fs.writeFile(`${dataFolder}/${filename}`, fileContents, err => {
    if (err) {
      console.error(err.toString())
      res.status(500)
    } else {
      res.json(newDocument.toJson())
    }
  })
}

function updateDocument (req, res) {
  const documentId = req.params.id
  console.log(`Updating document ${documentId}.`)

  glob(`${dataFolder}/${documentId}*.json`, null, (err, filenames) => {
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
                fs.renameSync(filename, `${dataFolder}/${newFilename}`)
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

function deleteDocument (req, res) {
  const documentId = req.params.id
  console.log('Deleting document:', documentId)

  glob(`${dataFolder}/${documentId}*.json`, null, (err, filenames) => {
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

function publishDocument (req, res) {
  const documentId = req.params.id
  const slug = req.body.slug
  console.log(`Publishing document ${documentId} to ${slug}.html.`)

  glob(`${dataFolder}/${documentId}*.json`, null, (err, filenames) => {
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

module.exports = {
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  publishDocument
}
