<template>
  <div class="todos" v-if="isLoggedIn">
    <Sidebar />

    <div class="body">
      <div class="header">
        <h1>Todos</h1>
      </div>

      <div class="contents">
        <div class="list" v-for="content in contentsWithTodos" v-bind:key="content.id">
          <content-link v-bind:content="content" />

          <ul>
            <li v-for="(todo, index) in content.todos" v-bind:key="index" v-html="formatTodo(todo)" />
          </ul>
        </div>
      </div>
    </div>
  </div>

  <div class="loading-wrapper" v-else>
    <loading />
  </div>
</template>

<style lang="scss" scoped>
.todos {
  position: relative;
  display: flex;
  height: calc(100% - 36px);
}

.body {
  height: 100%;
  width: 82%;
}
// Responsiveness for sidebar.
@media (max-width:1160px) {
  .body {
    width: 100%;
  }
}

.header {
  height: 32px;
  padding: 10px 0;

  display: flex;
  justify-content: space-between;
  align-items: center;
}
h1 {
  font-size: 1.5rem;
  font-weight: 300;
  margin: 0 10px;
  height: 37px;
}
h2 {
  font-size: 1.2rem;
  font-weight: 300;
  margin: 0 10px;
  height: 37px;
}
.contents {
  overflow-y: scroll;
  height: calc(100% - 52px - 65px - 18px);
  padding-top: 12px;
}
ul {
  list-style-type: none;
  padding-left: 30px;
  margin-top: 0;
}
li {
  margin: 5px 0;
  line-height: 24px;
}
</style>

<script>
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'
import ContentLink from '@/components/ContentLink'

import { mapState, mapGetters } from 'vuex'

const _ = require('lodash')

export default {
  name: 'Todos',

  components: {
    Sidebar,
    Loading,
    ContentLink
  },

  mounted () {
    document.title = `Doctoral | Todos`
  },

  computed: {
    ...mapState(['contents']),
    ...mapGetters(['isLoggedIn']),

    contentsWithTodos () {
      return _.filter(this.contents, content => _.size(content.todos) > 0)
    }
  }, // computed

  methods: {
    formatTodo (todo) {
      if (_.includes(todo, 'checked="checked"')) {
        return ''
      } else {
        return todo
      }
    }
  }
}
</script>
