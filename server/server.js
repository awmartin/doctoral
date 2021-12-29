const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
// const mongoose = require('mongoose')
const cors = require('cors')
const app = express()

app.use(cors())

app.set('port', (process.env.PORT || 3000))

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'no-cache')
  next()
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

// ---------------------------------------------------------------------------------------
// App Routes

app.use('/', express.static(path.join(__dirname, '..', 'public')))

// ---------------------------------------------------------------------------------------
// Adapters and Databases

// const contentsController = require('./mongodb/controllers/contents')
// const documentsController = require('./mongodb/controllers/documents')
// const localMongoDB = 'mongodb://localhost/doctoral'
// mongoose.connect(process.env.MONGODB || process.env.MONGODB_URI || process.env.MONGOLAB_URI || localMongoDB)
// mongoose.connection.on('error', function() {
//   console.log('MongoDB Connection Error. Please make sure that MongoDB is running.')
//   process.exit(1)
// })

const FileSystemConfig = require('./fs/config')
const FileSystemAdapter = require('./fs/adapter')
const storageConfig = new FileSystemConfig()
const storageAdapter = new FileSystemAdapter(storageConfig, app)
storageAdapter.start()

// ---------------------------------------------------------------------------------------

app.listen(app.get('port'), function() {
  console.log('Server started: http://localhost:' + app.get('port') + '/')
})
