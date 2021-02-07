<template>
  <div class="archive" v-if="isLoggedIn">
    <Sidebar />

    <div class="body">
      <div class="header">
        <h1>Archive</h1>
      </div>

      <div class="contents">
        <content-link v-for="content in archiveContents" :content="content" :key="content.id" :options="linkOptions">
          <div class="float-right">
            <span>{{ getParentTitle(content) }}</span>
          </div>

          <div class="float">
            <button class="unarchive" @click="unarchive(content)" title="Unarchive">
              <archive-arrow-up-outline-icon />
            </button>
          </div>
        </content-link>
      </div>
    </div>
  </div>

  <div class="loading-wrapper" v-else>
    <loading />
  </div>
</template>

<style lang="scss" scoped>
.archive {
  display: flex;
  height: calc(100% - 36px);
}
.loading-wrapper {
  height: calc(100% - 36px);
  .loading {
    top: calc(50% - 25px);
    left: calc(50% - 25px);
  }
}

.body {
  min-height: 1px;
  width: 82%;
  height: 100%;
  display: flex;
  flex-direction: column;

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 20px;
    button .text {
      font-size: 0.8rem;
    }
  }
  h1 {
    font-weight: lighter;
    margin-top: 0;
    margin-bottom: 0;
    padding: 10px;
  }
  .contents {
    padding: 10px 0;
    overflow-y: scroll;
    flex-grow: 2;
  }

  .content-link {
    position: relative;
    width: calc(100% - 50px);
  }
  .float {
    position: absolute;
    left: calc(100% + 5px);
    top: 1px;
  }
  .float-right {
    position: absolute;
    right: 10px;
    top: 0;
    height: 100%;

    display: flex;
    align-items: center;
  }
}
</style>

<script>
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'
import ContentLink from '@/components/ContentLink'

import { ArchiveArrowUpOutline as ArchiveArrowUpOutlineIcon } from 'mdue'

import { mapGetters } from 'vuex'

const _ = require('lodash')

export default {
  name: 'Archive',

  components: {
    Sidebar,
    Loading,
    ContentLink,
    ArchiveArrowUpOutlineIcon
  },

  watch: {
    isReadyNotLoggedIn (newVal, oldVal) {
      if (newVal && !oldVal) {
        this.$router.push({ name: 'Login' })
      }
    },

    isLoggedIn (newVal, oldVal) {
      if (newVal && !oldVal) {
        this.$store.dispatch('registerArchiveListener')
      }
    }
  },

  data () {
    return {
      linkOptions: {
        includeHref: false
      }
    }
  },

  created () {
    this.$store.dispatch('registerArchiveListener')
  },

  mounted () {
    document.title = 'Doctoral | Archive'
  },

  beforeUnmount () {
    this.$store.dispatch('deregisterArchiveListener')
  },

  computed: {
    ...mapGetters(['isLoggedIn', 'isReadyNotLoggedIn', 'getContent', 'archiveContents'])
  },

  methods: {
    unarchive (content) {
      const onSuccess = () => {
        console.log(`Unarchived ${content.type}: ${content.title}`)
      }

      const onError = error => {
        console.error('Error occurred when unarchiving:', error)
      }

      this.$store.dispatch('unarchive', { content }).then(onSuccess).catch(onError)
    },

    getParent (content) {
      const parent = this.getContent(content.parent) || this.getArchivedContent(content.parent)
      return parent
    },

    getParentTitle (content) {
      const parent = this.getParent(content)
      if (_.isObject(parent)) {
        return parent.title
      } else {
        return ''
      }
    }
  } // end methods
}
</script>
