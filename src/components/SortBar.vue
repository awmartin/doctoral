<template>
  <div class="sortbar">
    <button @click="sortByTitle" :class="getSortButtonClass('sortByTitle')">
      <sort-alphabetical-variant-icon />
    </button>
    <button @click="sortByLastUpdated" :class="getSortButtonClass('sortByLastUpdated')">
      <clock-outline-icon />
    </button>

    <button @click="sortByAscending" :class="getSortButtonClass('sortByAscending')">
      <chevron-triple-down-icon />
    </button>
    <button @click="sortByDescending" :class="getSortButtonClass('sortByDescending')">
      <chevron-triple-up-icon />
    </button>

    <button @click="sortFoldersToTop" :class="getSortButtonClass('sortFoldersToTop')">
      <folder-outline-icon />
    </button>
  </div>
</template>

<style lang="scss" scoped>
button {
  margin-left: 5px;
  margin-right: 0;
}
</style>

<script>
import { mapState } from 'vuex'

import { FolderOutline as FolderOutlineIcon } from 'mdue'
import { ClockOutline as ClockOutlineIcon } from 'mdue'
import { SortAlphabeticalVariant as SortAlphabeticalVariantIcon } from 'mdue'
import { ChevronTripleUp as ChevronTripleUpIcon } from 'mdue'
import { ChevronTripleDown as ChevronTripleDownIcon } from 'mdue'

export default {
  name: 'SortBar',

  components: {
    FolderOutlineIcon,
    ClockOutlineIcon,
    SortAlphabeticalVariantIcon,
    ChevronTripleUpIcon,
    ChevronTripleDownIcon
  },

  computed: {
    ...mapState(['sortDirection', 'sortGrouping', 'sortField'])
  },

  methods: {
    sortFoldersToTop () {
      if (this.sortGrouping === 'folders') {
        this.$store.commit('setSortGroupingNone')
      } else {
        this.$store.commit('setSortGroupingFolders')
      }
    },

    sortByLastUpdated () {
      this.$store.commit('setSortByLastUpdated')
    },

    sortByTitle () {
      this.$store.commit('setSortByTitle')
    },

    sortByAscending () {
      this.$store.commit('setSortDirectionAscending')
    },

    sortByDescending () {
      this.$store.commit('setSortDirectionDescending')
    },

    getSortButtonClass (sortType) {
      let tr = 'toggle '

      if (sortType === 'sortFoldersToTop') {
        tr += this.sortGrouping === 'folders' ? 'selected' : 'unselected'
      } else if (sortType === 'sortByLastUpdated') {
        tr += this.sortField === 'updated' ? 'selected' : 'unselected'
      } else if (sortType === 'sortByTitle') {
        tr += this.sortField === 'title' ? 'selected' : 'unselected'
      } else if (sortType === 'sortByAscending') {
        tr += this.sortDirection === 'ascending' ? 'selected' : 'unselected'
      } else if (sortType === 'sortByDescending') {
        tr += this.sortDirection === 'descending' ? 'selected' : 'unselected'
      } else {
        tr += 'unselected'
      }

      return tr
    }
  }
}
</script>