const _ = require('lodash')

export default {
  getDocUrlId (content) {
    const trimTitle = _.trim(content.title)
    const titleForUrl = _.replace(trimTitle, /[^a-zA-Z0-9]/g, '-')
    const sanitizedTitleUrl = _.replace(titleForUrl, /[0]{1,}/, '-')
    const titleUrl = _.trim(sanitizedTitleUrl, '-')
    return `${content.key || content.id}-${titleUrl}`
  }
}
