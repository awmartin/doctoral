<template>
  <div class="document-list">
    <div class="header">
      <button @click="createDocument">
        <plus-icon /><file-document-outline-icon />
      </button>
    </div>

    <document-link v-for="document in documents"
      v-bind:key="document.id"
      v-bind:document="document">
    </document-link>
  </div>
</template>

<style lang="scss" scoped>
.header {
  padding: 10px;
}
</style>

<script>
import { mapState } from 'vuex'
import DocumentLink from '@/components/DocumentLink'
import FileDocumentOutlineIcon from 'vue-material-design-icons/FileDocumentOutline'
import PlusIcon from 'vue-material-design-icons/Plus'

const fb = require('../firebase.js')

export default {
  name: 'DocumentList',

  components: {
    FileDocumentOutlineIcon,
    PlusIcon,
    DocumentLink
  },

  computed: {
    ...mapState(['documents', 'currentUser'])
  },

  methods: {
    createDocument () {
      const documents = fb.db.collection('data').doc(this.currentUser.uid).collection('documents')
      documents.add({
        title: '',
        content: ''
      }).then(ref => {
        this.$router.push({ name:'Document', params: { id: ref.id } })
      })
    }
  }
}
</script>