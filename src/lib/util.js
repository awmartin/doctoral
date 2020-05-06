import { DateTime } from 'luxon'
const _ = require('lodash')

function getTitleUrl (title) {
  const trimTitle = _.trim(title)
  const titleForUrl = _.replace(trimTitle, /[^a-zA-Z0-9]/g, '-')
  const sanitizedTitleUrl = _.replace(titleForUrl, /[-]{1,}/g, '-')
  const titleUrl = _.trim(sanitizedTitleUrl, '-')
  return titleUrl
}

function getDocUrlId (content) {
  const titleUrl = getTitleUrl(content.title)
  return `${content.key || content.id}-${titleUrl}`
}

function getIdFromRouteParam (param) {
  return _.head(_.split(param, '-'))
}

function pushUniq (arrayCandidate, element) {
  if (_.isNil(arrayCandidate)) {
    return [element]
  } else {
    return _.uniq(_.concat(arrayCandidate, element))
  }
}


const formatDate = date => {
  const formatStr = 'yyyy MMM dd'

  if (_.isObject(date) && date.isLuxonDateTime) {
    return date.toFormat(formatStr)
  } else if (_.isDate(date)) {
    const dt = DateTime.fromJSDate(date)
    return dt.toFormat(formatStr)
  } else if (_.isString(date)) {
    const d = new Date(date)
    if (_.isDate(d)) {
      const dt = DateTime.fromJSDate(d)
      return dt.toFormat(formatStr)
    }
  } else {
    return ''
  }
}

const formatTime = date => {
  const formatStr = 'h:mm a'

  if (_.isObject(date) && date.isLuxonDateTime) {
    return _.toLower(date.toFormat(formatStr))
  } else if (_.isDate(date)) {
    const dt = DateTime.fromJSDate(date)
    return  _.toLower(dt.toFormat(formatStr))
  } else {
    return ''
  }
}

const successPromise = message => {
  return new Promise(resolve => {
    resolve(message)
  })
}

const errorPromise = message => {
  return new Promise((resolve, reject) => {
    reject(message)
  })
}

export default {
  getTitleUrl,
  getDocUrlId,
  getIdFromRouteParam,
  pushUniq,
  formatDate,
  formatTime,
  successPromise,
  errorPromise
}
