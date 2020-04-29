import Document from '@/models/Document'
const _ = require('lodash')

const DocumentConverter = {
  toFirestore: document => {
    const data =  {
      title: document.title,
      content: document.body,
      updated: document.updated
    }

    if (_.isNil(document.created)) {
      document.created = document.updated
    }

    return data
  },

  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options)
    return new Document.Document(data.title, data.content, snapshot.id, data.created.toDate(), data.updated.toDate())
  }
}

export default {
  DocumentConverter
}
