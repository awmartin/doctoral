<template>
  <div :class="menuClass">
    <div class="left">
      <div class="warning-message" v-if="showWarning">{{ warningMessage }}</div>

      <breadcrumb :content="content" v-else />
    </div>

    <div class="right">
      <span class="saving" v-if="isSavingDocument">
        <span class="message">Saving…</span>
        <progress-alert-icon class="icon" />
      </span>

      <span class="publishing" v-if="isPublishing">
        <span class="message">Publishing…</span>
        <progress-alert-icon class="icon" />
      </span>

      <button @click="toggleStarDocument" :class="starDocumentClass" :disabled="disabled" title="Star this document">
        <star-icon v-if="isStarred" />
        <star-outline-icon v-else />
      </button>

      <move-dropdown :target="content" :direction="'left'" :disabled="disabled" />

      <button @click="archiveDocument" :disabled="disabled" title="Archive this document">
        <archive-outline-icon />
      </button>


      <div class="separator">&nbsp;</div> <!-- ======================================== -->


      <button @click="exportWordDocument" title="Export as Word document">
        <file-word-outline-icon />
      </button>

      <button @click="publishDocument" class="publish-document" :disabled="isPublishing || isSavingDocument || disabled" title="Publish">
        <publish-icon />
      </button>


      <div class="separator">&nbsp;</div> <!-- ======================================== -->


      <double-press-button :click="trashDocument" :disabled="disabled" class="trash-document" title="Trash this document">
        <delete-outline-icon />
      </double-press-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.menu {
  height: 32px;
  padding: 10px 0;
  left: 18%;
  width: 100%;

  display: flex;
  justify-content: space-between;
  align-items: center;

  &.warning {
    background-color: lighten(lightcoral, 7%);
  }
  .warning-message {
    color: white;
    font-weight: 500;
    padding-left: 10px;
  }
  .saving {
    margin-right: 10px;
  }
  .message {
    font-style: italic;
    font-size: 0.8rem;
  }
  .star-document {
    margin-right: 5px;
  }

  .left {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    button {
      margin-right: 5px;
    }
  }
  .right {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    button {
      margin-left: 5px;
    }
  }

  // Some button spacing.
  .publishing {
    color: gray;
  }
  button.trash-document {
    margin-right: 10px;
  }

  .separator {
    display: inline-block;
    width: 10px;
    height: 100%;
  }
}
</style>

<script>
import DoublePressButton from '@/components/DoublePressButton'
import MoveDropdown from '@/components/MoveDropdown'
import Breadcrumb from '@/components/Breadcrumb'

import { DeleteOutline as DeleteOutlineIcon } from 'mdue'
import { ProgressAlert as ProgressAlertIcon } from 'mdue'
import { Publish as PublishIcon } from 'mdue'
import { Star as StarIcon } from 'mdue'
import { StarOutline as StarOutlineIcon } from 'mdue'
import { FileWordOutline as FileWordOutlineIcon } from 'mdue'
import { ArchiveOutline as ArchiveOutlineIcon } from 'mdue'

import word from '@/lib/msft-word-exporter'

import { mapState, mapGetters } from 'vuex'
const _ = require('lodash')

export default {
  name: 'DocumentToolbar',

  props: {
    document: {
      default: null,
      required: true
    }
  },

  components: {
    DoublePressButton,
    StarIcon,
    StarOutlineIcon,
    DeleteOutlineIcon,
    ProgressAlertIcon,
    PublishIcon,
    FileWordOutlineIcon,
    ArchiveOutlineIcon,
    MoveDropdown,
    Breadcrumb
  },

  data () {
    return {
      isPublishing: false
    }
  },

  computed: {
    ...mapState(['isSavingDocument']),
    ...mapGetters(['getContent', 'isInTrashedAncestorFolder']),

    content () {
      // Use getContent to get the updated table-of-contents object.
      if (_.isObject(this.document?.content) && !this.document.content.archived) {
        const contentId = this.document.content.id
        return this.getContent(contentId)
      } else if (_.isObject(this.document?.content) && this.document.content.archived) {
        return this.document.content
      } else {
        return null
      }
    },

    menuClass () {
      let tr = 'menu'
      if (this.showWarning) {
        tr += ' warning'
      }
      return tr
    },

    isTrashed () {
      return _.isObject(this.content) ? !!this.content.trashed : false
    },

    warningMessage () {
      if (this.isTrashed) {
        return 'This document is in the Trash. Restore to edit.'
      } else if (this.isInTrashedAncestorFolder) {
        return `This document is in a folder in the Trash. Move it or restore the folder to edit.`
      }
      return ''
    },

    showWarning () {
      return this.isTrashed || this.isInTrashedAncestorFolder(this.content)
    },

    disabled () {
      return this.isTrashed || this.isInTrashedAncestorFolder(this.content) || _.isNil(this.content) || this.content.archived
    },

    isStarred () {
      return _.isObject(this.content) ? !!this.content.starred : false
    },

    starDocumentClass () {
      let tr = 'star-document toggle '
      if (this.isStarred) {
        tr += 'selected'
      } else {
        tr += 'unselected'
      }
      return tr
    }
  },

  methods: {
    publishDocument () {
      if (_.isNil(this.content)) { return }

      this.isPublishing = true

      const onSuccess = result => {
        console.log('Published a document:', this.document.title, result)
        this.isPublishing = false
      }

      const onError = error => {
        console.error('An error occurred while publishing:', error)
        this.isPublishing = false
      }

      this.$store.dispatch('publishDocument', {
        document: this.document,
        onSuccess,
        onError
      })
    },

    toggleStarDocument () {
      if (this.disabled || _.isNil(this.content)) { return }

      const documentTitle = this.content.title
      const onSuccess = () => {
        console.log('Toggled star on document:', documentTitle)
      }

      const onError = error => {
        console.error('Error occured when toggling the star on a document:', error)
      }

      this.$store.dispatch('toggleStar', {
        content: this.content,
        onSuccess,
        onError
      })
    },

    trashDocument () {
      if (this.disabled || _.isNil(this.content)) { return }

      const documentTitle = this.content.title
      const onSuccess = () => {
        console.log('Sent a document to the trash:', documentTitle)
        this.$router.push({ name: 'Dashboard' })
      }

      const onError = error => {
        console.error('An error occurred when moving a document to the trash:', error)
      }

      this.$store.dispatch('trashDocument', {
        document: this.document,
        onSuccess,
        onError
      })
    },

    exportWordDocument () {
      console.log('Exporting as a MSFT Word docx file.')
      word.exportWordDocument(this.document)
    },

    archiveDocument () {
      if (this.disabled || _.isNil(this.content)) { return }

      const documentTitle = this.content.title
      const onSuccess = () => {
        console.log(`Archive document: ${documentTitle}`)
      }

      const onError = error => {
        console.error('An error occurred while archiving a document:', error)
      }

      this.$store.dispatch('archive', { content: this.document.content }).then(onSuccess).catch(onError)
    }
  } // end methods
} // end export
</script>
