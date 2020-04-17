<template>
  <div class="filter-bar">
    <button @click="toggleFilter('all')" :class="getToggleButtonClass('all')">
      <view-headline-icon />
    </button>

    <button @click="toggleFilter('starred')" :class="getToggleButtonClass('starred')">
      <playlist-star-icon />
    </button>
  </div>
</template>

<style lang="scss" scoped>
button {
  margin-right: 5px;
}
</style>

<script>
import ViewHeadlineIcon from 'vue-material-design-icons/ViewHeadline'
import PlaylistStarIcon from 'vue-material-design-icons/PlaylistStar'

import { mapState } from 'vuex'

export default {
  name: 'FilterBar',

  components: {
    ViewHeadlineIcon,
    PlaylistStarIcon
  },

  computed: {
    ...mapState(['filterTag'])
  },

  methods: {
    toggleFilter (filterTag) {
      this.$store.commit('setFilterTag', filterTag)
    },

    getToggleButtonClass (filterTag) {
      let tr = 'toggle '
      if (this.filterTag === filterTag) {
        tr += filterTag
      } else {
        tr += `${filterTag} unselected`
      }
      return tr
    }
  }
}
</script>