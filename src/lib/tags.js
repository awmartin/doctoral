import util from '@/lib/util'
const _ = require('lodash')

function extractFromHtml (document, htmlString) {
  // TODO Move tag logic outside of the editor component.

  // Parse the editor's contents.
  const html = document.createElement('html')
  html.innerHTML = htmlString

  const snippets = {}
  const mentions = html.getElementsByClassName('mention')
  const tagElements = _.filter(mentions, mention => _.startsWith(mention.textContent, '#'))
  const tags = _.uniq(_.map(tagElements, tagElement => tagElement.textContent))

  const getSnippet = (context, hashtag) => {
    // TODO Extract a smaller snippet from parents p, li, h1, h2, h3, h4.
    _.noop(hashtag)
    return util.escapeHtmlChars(context)
  }

  const getTagAndSnippet = elt => {
    const hashtag = elt.textContent
    const parentContext = elt.parentElement.textContent
    const snippet = getSnippet(parentContext, hashtag)

    if (!_.has(snippets, hashtag)) {
      snippets[hashtag] = []
    }
    snippets[hashtag].push(snippet)
  }
  _.forEach(tagElements, getTagAndSnippet)

  return { tags, snippets }
}

export default { extractFromHtml }
