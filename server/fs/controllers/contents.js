const Content = require('../models/Content')
const fs = require('fs')
const _ = require('lodash')
const rootFolder = './data'

function getAllContents (req, res) {
  fs.readFile(`${rootFolder}/contents.json`, (err, data) => {
    if (err) {
      console.error(err.toString())
      res.json([])
    } else {
      const contents = JSON.parse(data).contents
      console.log(`Contents query successful. Returning ${contents.length} contents objects.`)
      res.json(contents)
    }
  })
}

function createContent (req, res) {
  console.log("Attempting to create a new content object.")

  fs.readFile(`${rootFolder}/contents.json`, (err, data) => {
    if (err) {
      console.error(err.toString())
      res.json([])
    } else {
      const newContent = new Content(req.body)
      
      const contents = JSON.parse(data).contents
      contents.push(newContent.toJson())
      
      const json = JSON.stringify({ contents }, null, '  ')

      fs.writeFile(`${rootFolder}/contents.json`, json, err => {
        if (err) {
          console.error(err.toString())
          res.status(500)
        } else {
          res.json(newContent.toJson())
        }

      }) // end writeFile
    }
  })
}

function updateContent (req, res) {
  const contentId = req.params.id
  console.log(`Updating content ${contentId}.`)

  fs.readFile(`${rootFolder}/contents.json`, (err, data) => {
    if (err) {
      console.error(err.toString())
      res.json([])
    } else {
      const contents = JSON.parse(data).contents

      const content = _.find(contents, content => content.id === contentId)
      if (content) {
        const expectedFields = ['title', 'type', 'starred', 'trashed', 'key', 'parent', 'children', 'created', 'updated']

        _.forEach(expectedFields, field => {
          if (_.has(req.body, field)) {
            const value = req.body[field]
            content[field] = value
          }
        })
      }

      const json = JSON.stringify({ contents }, null, '  ')

      fs.writeFile(`${rootFolder}/contents.json`, json, err => {
        if (err) {
          console.error(err.toString())
          res.status(500)
        } else {
          res.send(content)
        }

      }) // end writeFile
    } // end success
  }) // end readFile
}

function deleteContent (req, res) {
  const contentId = req.params.id
  console.log('Deleting content:', contentId)

  fs.readFile(`${rootFolder}/contents.json`, (err, data) => {
    if (err) {
      console.error(err.toString())
      res.json([])
    } else {
      const contents = JSON.parse(data).contents
      const without = _.filter(contents, content => content.id !== contentId)
      const json = JSON.stringify({ contents: without }, null, '  ')

      fs.writeFile(`${rootFolder}/contents.json`, json, err => {
        if (err) {
          console.error(err.toString())
          res.status(500)
        } else {
          res.json({ id: contentId })
        }
      })
    }
  })
}

module.exports = {
  getAllContents,
  createContent,
  updateContent,
  deleteContent
}
