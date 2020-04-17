<template>
  <div class="sortbar">
    <button @click="sortByTitle" :class="getSortButtonClass('sortByTitle')">
      <sort-alphabetical-icon />
    </button>
    <button @click="sortByLastUpdated" :class="getSortButtonClass('sortByLastUpdated')">
      <clock-outline-icon />
    </button>

    <button @click="sortByDescending" :class="getSortButtonClass('sortByDescending')">
      <sort-descending-icon />
    </button>
    <button @click="sortByAscending" :class="getSortButtonClass('sortByAscending')">
      <sort-ascending-icon />
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

  &[disabled] {
    background-color: #eee;
  }
  &.unselected {
    background-color: #ddd;
  }
  &.unselected:hover {
    background-color: darken(#ddd, 10%);
  }
  &.unselected:active {
    background-color: darken(#ddd, 20%);
  }
}
</style>

<script>
import FolderOutlineIcon from 'vue-material-design-icons/FolderOutline'
import ClockOutlineIcon from 'vue-material-design-icons/ClockOutline'
import SortAlphabeticalIcon from 'vue-material-design-icons/SortAlphabetical'
import SortAscendingIcon from 'vue-material-design-icons/SortAscending'
import SortDescendingIcon from 'vue-material-design-icons/SortDescending'
import { mapState } from 'vuex'

export default {
  name: 'SortBar',

  components: {
    FolderOutlineIcon,
    ClockOutlineIcon,
    SortAlphabeticalIcon,
    SortAscendingIcon,
    SortDescendingIcon
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
      if (sortType === 'sortFoldersToTop') {
        return this.sortGrouping === 'folders' ? 'selected' : 'unselected'
      } else if (sortType === 'sortByLastUpdated') {
        return this.sortField === 'updated' ? 'selected' : 'unselected'
      } else if (sortType === 'sortByTitle') {
        return this.sortField === 'title' ? 'selected' : 'unselected'
      } else if (sortType === 'sortByAscending') {
        return this.sortDirection === 'ascending' ? 'selected' : 'unselected'
      } else if (sortType === 'sortByDescending') {
        return this.sortDirection === 'descending' ? 'selected' : 'unselected'
      } else {
        return 'unselected'
      }
    }
  }
}
</script>