<template>
  <div class="filter-bar">
    <toggle-button action="viewDocumentsInSidebar" field="filterTag" value="all">
      <view-headline-icon />
    </toggle-button>

    <toggle-button action="viewStarredInSidebar" field="filterTag" value="starred">
      <playlist-star-icon />
    </toggle-button>

    <toggle-button action="viewTagsInSidebar" field="filterTag" value="tagslist">
      <tag-outline-icon />
    </toggle-button>
  </div>
</template>

<style lang="scss" scoped>
button {
  margin-right: 5px;
}
</style>

<script>
import { ViewHeadline as ViewHeadlineIcon } from 'mdue'
import { PlaylistStar as PlaylistStarIcon } from 'mdue'
import { TagOutline as TagOutlineIcon } from 'mdue'

import ToggleButton from '@/components/ToggleButton'

export default {
  name: 'FilterBar',

  components: {
    ViewHeadlineIcon,
    PlaylistStarIcon,
    TagOutlineIcon,
    ToggleButton
  }
}
</script>
