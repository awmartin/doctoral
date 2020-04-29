<template>
  <div class="sortbar">
    <button @click="sortByTitle" :class="getSortButtonClass('sortByTitle')">
      <sort-alphabetical-icon />
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
import FolderOutlineIcon from 'vue-material-design-icons/FolderOutline'
import ClockOutlineIcon from 'vue-material-design-icons/ClockOutline'
import SortAlphabeticalIcon from 'vue-material-design-icons/SortAlphabetical'
// import SortAscendingIcon from 'vue-material-design-icons/SortAscending'
// import SortDescendingIcon from 'vue-material-design-icons/SortDescending'
import ChevronTripleUpIcon from 'vue-material-design-icons/ChevronTripleUp'
import ChevronTripleDownIcon from 'vue-material-design-icons/ChevronTripleDown'
import { mapState } from 'vuex'

export default {
  name: 'SortBar',

  components: {
    FolderOutlineIcon,
    ClockOutlineIcon,
    SortAlphabeticalIcon,
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