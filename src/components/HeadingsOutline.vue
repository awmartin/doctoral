<template>
  <div class="headings-outline">
    <document-heading :heading="titleHeading" :click="navigateToHeading(null)" />
    <document-heading :heading="heading" v-for="heading in headings" :key="heading.i" :click="navigateToHeading(heading)" />
  </div>
</template>

<style lang="scss" scoped>

</style>

<script>
import DocumentHeading from '@/components/DocumentHeading'
const _ = require('lodash')

export default {
  name: 'HeadingsOutline',

  props: ['document', 'scrollableElement'],

  components: {
    DocumentHeading
  },

  computed: {
    documentContent () {
      return this.document.content
    },

    headings () {
      return this.headingsByContent
    },

    headingsByContent () {
      const tr = []

      const getMatches = (str, regex) => {
        const tr = []
        let match = regex.exec(str)
        while (!_.isNil(match)) {
          tr.push(match)
          match = regex.exec(str)
        }
        return tr
      }

      const removeHtmlTags = text => {
        return _.replace(text, new RegExp('<[^>]*?>', 'g'), '')
      }

      const getHeadings = heading => {
        const headingRegex = new RegExp(`<${heading}[^>]*?>(.*?)</${heading}>`, 'g')
        const headingMatches = getMatches(this.documentContent, headingRegex)

        _.forEach(headingMatches, headingMatch => {
          const headingText = headingMatch[1]
          const text = removeHtmlTags(headingText)
          tr.push({
            i: headingMatch.index,
            text,
            level: heading
          })
        })
      }

      getHeadings('h2')
      getHeadings('h3')
      getHeadings('h4')
      getHeadings('h5')
      getHeadings('h6')

      tr.sort((a, b) => a.i > b.i ? 1 : -1)

      return tr
    },

    titleHeading () {
      return {
        text: this.document.title,
        level: 'h1'
      }
    }
  }, // computed

  methods: {
    getHeadingInDOM (headingObj) {
      const isHomeHeading = _.isNil(headingObj)
      if (isHomeHeading) {
        return { offsetTop: 40 }
      }

      if (_.isNil(this.scrollableElement)) { return null }

      const headingElements = this.scrollableElement.querySelectorAll(headingObj.level)
      const found = _.find(headingElements, heading => _.trim(heading.innerText) === _.trim(headingObj.text))
      if (!_.isNil(found)) {
        return found
      } else {
        return null
      }
    },

    navigateToHeading (headingObj) {
      return () => {
        const elt = this.getHeadingInDOM(headingObj)

        if (_.isNil(elt)) { return }
        if (_.isNil(this.scrollableElement)) { return }

        this.scrollableElement.scrollTo({
          left: 0, 
          top: elt.offsetTop - 90,
          behavior: 'smooth'
        })
      }
    },
  } // methods
}
</script>
