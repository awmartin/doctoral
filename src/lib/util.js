const _ = require('lodash')

function getTitleUrl (content) {
  const trimTitle = _.trim(content.title)
  const titleForUrl = _.replace(trimTitle, /[^a-zA-Z0-9]/g, '-')
  const sanitizedTitleUrl = _.replace(titleForUrl, /[0]{1,}/, '-')
  const titleUrl = _.trim(sanitizedTitleUrl, '-')
  return titleUrl
}

function getDocUrlId (content) {
  const titleUrl = getTitleUrl(content)
  return `${content.key || content.id}-${titleUrl}`
}

export default {
  getTitleUrl,
  getDocUrlId
}
