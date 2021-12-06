const _ = require('lodash')

// Expected structure from CKEditor.
// <ul class="todo-list">
//   <li>
//     <label class="todo-list__label">
//       <input type="checkbox"> OR <input type="checkbox" checked="checked">
//       <span class="todo-list__label__description">

class TodoExtractor {
  constructor (document) {
    this.document = document
  }

  extractFromHtml (htmlString) {
    const div = this.document.createElement('div')
    div.innerHTML = htmlString

    const lists = div.getElementsByClassName('todo-list')

    const todos = []
    _.each(lists, list => {
      const items = list.getElementsByTagName('li')
      for (const item of items) {
        todos.push(item.innerHTML)
      }
    })

    return todos
  }
}

export default { TodoExtractor }
