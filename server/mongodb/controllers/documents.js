const Document = require('../models/Document')
const _ = require('lodash')

function getDocument (req, res) {
  var onFind = function(err, doc) {
    if (err) {
      res.status(500)
    } else {
      console.log(`Document query successful. Returning doc ${doc._id} ${doc.title}.`)
      res.send(doc)
    }
  };

  Document.findById(req.params.id, onFind);
}

function createDocument (req, res) {
  console.log("Attempting to create a new document object.")

  const newDocument = new Document(req.body)

  const onComplete = err => {
    if (err) {
      console.error("Error creating a document:", err.toString())
      res.status(500)
    } else {
      console.log("Successfully created document:", newDocument._id)
      res.json(newDocument)
    }
  }

  newDocument.save(onComplete)
}

function updateDocument (req, res) {
  const documentId = req.params.id
  console.log(`Updating document ${documentId}.`)

  const onFind = (err, document) => {
    if (err) {
      res.status(500)
      return
    }

    const expectedFields = ['title', 'body', 'created', 'updated']
    _.forEach(expectedFields, field => {
      if (_.has(req.body, field)) {
        const value = req.body[field]
        document[field] = value
      }
    })

    document.save(err => {
      if (err) {
        console.error("Error updating document:", documentId, err.toString())
        res.status(500)
      } else {
        console.log("Successfully updated document:", documentId)
        res.send(document)
      }
    })
  }

  Document.findById(req.params.id, onFind)
}

function deleteDocument (req, res) {
  const documentId = req.params.id
  console.log('Deleting document:', documentId)

  const onDelete = function(err) {
    if (err) {
      console.error("Error while deleting document:", documentId, err.toString())
      res.status(500)
    } else {
      console.log("Successfully deleted document:", documentId)
      res.json({
        id: documentId
      })
    }
  }

  Document.deleteOne({
    _id: documentId
  }, onDelete)
}

function publishDocument (req, res) {
  res.status(404)
  res.send('Publication not yet implemented for the MongoDB backend.')
}

module.exports = {
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  publishDocument
}
