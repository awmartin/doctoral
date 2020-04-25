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

      <button @click="toggleStarDocument" :class="starDocumentClass" :disabled="disabled">
        <star-icon v-if="isStarred" />
        <star-outline-icon v-else />
      </button>

      <move-dropdown :target="content" :direction="'left'" />

      <button @click="publishDocument" class="publish-document" :disabled="isPublishing || isSavingDocument || disabled">
        <publish-icon />
      </button>

      <double-press-button :click="trashDocument" class="trash-document">
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
    margin-left: 15px;
    margin-right: 10px;
  }
}
</style>

<script>
import DoublePressButton from '@/components/DoublePressButton'
import MoveDropdown from '@/components/MoveDropdown'
import Breadcrumb from '@/components/Breadcrumb'

import DeleteOutlineIcon from 'vue-material-design-icons/DeleteOutline'
import ProgressAlertIcon from 'vue-material-design-icons/ProgressAlert'
import PublishIcon from 'vue-material-design-icons/Publish'
import StarIcon from 'vue-material-design-icons/Star'
import StarOutlineIcon from 'vue-material-design-icons/StarOutline'

import { mapGetters } from 'vuex'
const _ = require('lodash')

export default {
  name: 'DocumentToolbar',

  props: {
    contentDocumentPair: {
      default: null,
      type: Object
    }
  },

  components: {
    DoublePressButton,
    StarIcon,
    StarOutlineIcon,
    DeleteOutlineIcon,
    ProgressAlertIcon,
    PublishIcon,
    MoveDropdown,
    Breadcrumb
  },

  data () {
    return {
      isPublishing: false
    }
  },

  computed: {
    ...mapGetters(['getContent', 'isSavingDocument', 'isInTrashedAncestorFolder']),

    content () {
      // Use getContent to get the updated table-of-contents object.
      if (_.isObject(this.contentDocumentPair) && _.isObject(this.contentDocumentPair.content)) {
        const contentId = this.contentDocumentPair.content.id
        return this.getContent(contentId)
      } else {
        return null
      }
    },

    document () {
      return _.isObject(this.contentDocumentPair) ? this.contentDocumentPair.document : null
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
      return this.isTrashed || this.isInTrashedAncestorFolder(this.content)
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
      if (_.isNil(this.content)) { return }

      const documentTitle = this.content.title
      const onSuccess = () => {
        console.log('Sent a document to the trash:', documentTitle)
        this.$router.push({ name: 'Dashboard' })
      }

      const onError = error => {
        console.error('An error occurred when moving a document to the trash:', error)
      }

      this.$store.dispatch('trashDocument', {
        document: this.content,
        onSuccess,
        onError
      })
    }
  }
}
</script>
