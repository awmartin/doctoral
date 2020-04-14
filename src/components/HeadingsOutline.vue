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

      const headingIndices = {
        h2: 0,
        h3: 0,
        h4: 0,
        h5: 0,
        h6: 0
      }

      const getHeadings = heading => {
        const headingRegex = new RegExp(`<${heading}[^>]*?>(.*?)</${heading}>`, 'g')
        const headingMatches = getMatches(this.documentContent, headingRegex)

        _.forEach(headingMatches, headingMatch => {
          const headingText = headingMatch[1]
          const text = removeHtmlTags(headingText)

          tr.push({
            char: headingMatch.index, // character position
            index: headingIndices[heading], // which nth heading occurrence
            text,
            level: heading
          })

          headingIndices[heading] += 1
        })
      }

      getHeadings('h2')
      getHeadings('h3')
      getHeadings('h4')
      getHeadings('h5')
      getHeadings('h6')

      tr.sort((a, b) => a.char > b.char ? 1 : -1)

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
      // const found = _.filter(headingElements, heading => _.trim(heading.innerText) === _.trim(headingObj.text))

      if (_.size(headingElements) > 0) {
        return headingElements[headingObj.index]
      } else {
        return null
      }
    },

    navigateToHeading (headingObj) {
      return () => {
        const elt = this.getHeadingInDOM(headingObj)

        if (_.isNil(elt)) { return }
        if (_.isNil(this.scrollableElement)) { return }

        if (_.trim(headingObj.text) !== _.trim(elt.innerText)) {
          console.error(`Tried to navigate to ${headingObj.level} ${headingObj.text} but went to ${elt.innerText}`)
        }

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
