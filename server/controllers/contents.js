const Content = require('../models/Content')
const _ = require('lodash')

function getAllContents (req, res) {
  Content.find({}).exec((err, contents) => {
    if (err) {
      console.error(err.toString())
      res.json([])
    } else {
      console.log(`Contents query successful. Returning ${contents.length} contents objects.`)
      res.json(contents)
    }
  })
}

function createContent (req, res) {
  console.log("Attempting to create a new content object.")

  const newContent = new Content(req.body)

  const onComplete = err => {
    if (err) {
      console.error("Error creating a content object:", err.toString())
      res.status(500)
    } else {
      console.log("Successfully created content:", newContent._id)
      res.json(newContent)
    }
  };

  newContent.save(onComplete)
}

function updateContent (req, res) {
  const contentId = req.params.id
  console.log(`Updating content ${contentId}.`);

  const onFind = (err, content) => {
    if (err) {
      res.status(500)
      return
    }

    const expectedFields = ['title', 'type', 'starred', 'trashed', 'key', 'parent', 'children', 'created', 'updated']
    _.forEach(expectedFields, field => {
      if (_.has(req.body, field)) {
        const value = req.body[field]
        content[field] = value
      }
    })

    content.save(err => {
      if (err) {
        console.error("Error updating content:", contentId, err.toString())
        res.status(500)
      } else {
        console.log("Successfully updated content:", contentId)
        res.send(content)
      }
    })
  }

  Content.findById(req.params.id, onFind)
}

function deleteContent (req, res) {
  const contentId = req.params.id

  console.log('Deleting content:', contentId)

  const onDelete = function(err) {
    if (err) {
      console.error("Error while deleting content:", contentId, err.toString())
      res.status(500)
    } else {
      console.log("Successfully deleted content:", contentId)
      res.json({
        id: contentId
      })
    }
  }

  Content.deleteOne({
    _id: contentId
  }, onDelete)
}

module.exports = {
  getAllContents,
  createContent,
  updateContent,
  deleteContent
}
