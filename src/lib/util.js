const _ = require('lodash')

function getTitleUrl (content) {
  const trimTitle = _.trim(content.title)
  const titleForUrl = _.replace(trimTitle, /[^a-zA-Z0-9]/g, '-')
  const sanitizedTitleUrl = _.replace(titleForUrl, /[-]{1,}/g, '-')
  const titleUrl = _.trim(sanitizedTitleUrl, '-')
  return titleUrl
}

function getDocUrlId (content) {
  const titleUrl = getTitleUrl(content)
  return `${content.key || content.id}-${titleUrl}`
}

function getIdFromRouteParam (param) {
  return _.head(_.split(param, '-'))
}

function push (arrayCandidate, element) {
  if (_.isNil(arrayCandidate)) {
    return [element]
  } else {
    return _.concat(arrayCandidate, element)
  }
}

const isContent = _.conforms({
  id: _.isString,
  'type': t => t === 'Folder' || t === 'Document'
})

const isContentForFolder = _.conforms({
  id: _.isString,
  'type': t => t === 'Folder'
})

const isContentForDocument = _.conforms({
  id: _.isString,
  'type': t => t === 'Document',
  key: _.isString
})

const isDocument = _.conforms({
  id: _.isString,
  content: _.isString
})

export default {
  getTitleUrl,
  getDocUrlId,
  getIdFromRouteParam,
  push,
  isContent,
  isContentForFolder,
  isContentForDocument,
  isDocument
}
