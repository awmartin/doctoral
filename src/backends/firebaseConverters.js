import Document from '@/models/Document'
import Content from '@/models/Content'

const DocumentConverter = {
  toFirestore: document => {
    const data = {
      title: document.title,
      content: document.body,
      created: document.created || document.updated,
      updated: document.updated
    }

    return data
  },

  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options)
    const updated = data.updated ? data.updated.toDate() : null
    const created = data.created ? data.created.toDate() : updated

    return new Document.Document(data.title, data.content, snapshot.id, created, updated)
  }
}

const ContentConverter = {
  toFirestore: content => {
    const data = {
      title: content.title,
      type: content.type,
      key: content.key,
      parent: content.parent,
      trashed: content.trashed,
      starred: content.starred,
      created: content.created || content.updated,
      updated: content.updated
    }

    if (content.isFolder()) {
      data.children = content.children || []
    }

    return data
  },

  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options)
    const updated = data.updated ? data.updated.toDate() : null
    const created = data.created ? data.created.toDate() : updated

    const content = new Content.Content(
      data.title,
      data.type,
      data.starred,
      data.trashed,
      snapshot.id,
      data.key,
      data.parent,
      created,
      updated
    )

    content.setChildren(data.children)

    return content
  }
}

export default {
  DocumentConverter,
  ContentConverter
}
