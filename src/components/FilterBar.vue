<template>
  <div class="filter-bar">
    <toggle-button action="viewDocumentsInSidebar" field="filterTag" value="all" title="Document tree">
      <file-tree-icon />
    </toggle-button>

    <toggle-button action="viewAllDocumentsInSidebar" field="filterTag" value="all-documents" title="All documents">
      <view-headline-icon />
    </toggle-button>

    <toggle-button action="viewAllFoldersInSidebar" field="filterTag" value="all-folders" title="All folders">
      <folder-multiple-outline-icon />
    </toggle-button>

    <toggle-button action="viewStarredInSidebar" field="filterTag" value="starred" title="Starred documents and folders">
      <playlist-star-icon />
    </toggle-button>

    <toggle-button action="viewTagsInSidebar" field="filterTag" value="tagslist" title="All tags">
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
import { FolderMultipleOutline as FolderMultipleOutlineIcon } from 'mdue'
import { FileTree as FileTreeIcon } from 'mdue'

import ToggleButton from '@/components/ToggleButton'

export default {
  name: 'FilterBar',

  components: {
    ViewHeadlineIcon,
    PlaylistStarIcon,
    TagOutlineIcon,
    FileTreeIcon,
    FolderMultipleOutlineIcon,
    ToggleButton
  }
}
</script>
