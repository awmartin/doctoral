const fs = require('fs')
const _ = require('lodash')

class FileSystemTagsController {
  constructor (config) {
    this.config = config
  }

  get rootFolder () {
    return this.config.rootFolder
  }

  loadTagSnippets (req, res) {
    // Given a tag, load all the snippets associated with the tag.

    const tag = req.params.id
    console.log(`Loading the tag snippets for tag ${tag}`)

    fs.readFile(`${this.rootFolder}/tags.json`, (err, data) => {
      if (err) {
        console.error(err.toString())
        res.json([])
      } else {
        const tags = JSON.parse(data)
        const hashtag = `#${tag}`
        console.log(`Tag query successful for ${hashtag}.`)
        res.json(tags[hashtag] || {})
      }
    })
  }

  updateTagSnippets (req, res) {
    console.log('Updating the tag snippets')

    fs.readFile(`${this.rootFolder}/tags.json`, (err, data) => {
      if (err) {
        console.error(err.toString())
        res.json([])
      } else {
        const currentTags = JSON.parse(data)
        const newTags = req.body

        // Merge the data into the current tag collection.
        _.forEach(newTags, (contentMap, tag) => {
          _.forEach(contentMap, (stringifiedSnippets, contentId) => {
            if (!_.has(currentTags, tag)) {
              currentTags[tag] = {}
            }
            currentTags[tag][contentId] = stringifiedSnippets
          })
        })

        const json = JSON.stringify(currentTags, null, '  ')
        fs.writeFile(`${this.rootFolder}/tags.json`, json, err => {
          if (err) {
            console.error(err.toString())
            res.status(500)
          } else {
            res.json({ status: 'ok' })
          }
        }) // end writeFile
      }
    })
  }
}

module.exports = FileSystemTagsController
