// import util from '@/lib/util'
const _ = require('lodash')

// Expected structure
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
    const html = this.document.createElement('html')
    html.innerHTML = htmlString

    const lists = html.getElementsByClassName('todo-list')

    // Gather every li child element.
    var todos = []
    _.each(lists, list => {
      const items = list.getElementsByTagName('li')
      items.forEach(item => {
        todos.push(item.innerHTML)
      })
    })

    return todos
  }
}

export default { TodoExtractor }
