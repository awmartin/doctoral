<template>
  <div :class="menuClass">
    <div class="left">
      <div class="warning-message" v-if="showWarning">{{ warningMessage }}</div>

      <breadcrumb :content="content" v-else />
    </div>

    <div class="right">
      <button @click="toggleStarFile" :class="starFileClass" :disabled="disabled" title="Star this file">
        <star-icon v-if="isStarred" />
        <star-outline-icon v-else />
      </button>

      <move-dropdown :target="content" :direction="'left'" :disabled="disabled" />

      <button @click="archiveFile" :disabled="disabled" title="Archive this file">
        <archive-outline-icon />
      </button>

      <div class="separator">&nbsp;</div> <!-- ======================================== -->

      <double-press-button :click="trashFile" :disabled="disabled" class="trash-file" title="Trash this file">
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
  .message {
    font-style: italic;
    font-size: 0.8rem;
  }
  .star-file {
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
  button.trash-file {
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
import { Star as StarIcon } from 'mdue'
import { StarOutline as StarOutlineIcon } from 'mdue'
import { ArchiveOutline as ArchiveOutlineIcon } from 'mdue'

import { mapGetters } from 'vuex'
const _ = require('lodash')

export default {
  name: 'DocumentToolbar',

  props: {
    content: {
      default: null,
      required: true
    }
  },

  components: {
    DoublePressButton,
    StarIcon,
    StarOutlineIcon,
    DeleteOutlineIcon,
    ArchiveOutlineIcon,
    MoveDropdown,
    Breadcrumb,
  },

  computed: {
    ...mapGetters(['isInTrashedAncestorFolder']),

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
        return 'This file has bene trashed.'
      } else if (this.isInTrashedAncestorFolder) {
        return `This file is in a trashed folder.`
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

    starFileClass () {
      let tr = 'star-file toggle '
      if (this.isStarred) {
        tr += 'selected'
      } else {
        tr += 'unselected'
      }
      return tr
    }
  }, // computed

  methods: {
    toggleStarFile () {
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

    trashFile () {
      if (this.disabled || _.isNil(this.content)) { return }

      const filename = this.content.title
      const onSuccess = () => {
        console.log('Sent a file to the trash:', filename)
        this.$router.push({ name: 'Dashboard' })
      }

      const onError = error => {
        console.error('An error occurred when moving a file to the trash:', error)
      }

      this.$store.dispatch('trashFile', {
        file: this.content,
        onSuccess,
        onError
      })
    },

    archiveFile () {
      if (this.disabled || _.isNil(this.content)) { return }

      const filename = this.content.title
      const onSuccess = () => {
        console.log(`Archive file: ${filename}`)
      }

      const onError = error => {
        console.error('An error occurred while archiving a file:', error)
      }

      this.$store.dispatch('archive', { content: this.content }).then(onSuccess).catch(onError)
    }
  } // end methods
} // end export
</script>
