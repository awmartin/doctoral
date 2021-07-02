<template>
  <main class="todos" v-if="isLoggedIn">
    <Sidebar />

    <div class="body">
      <div class="header">
        <h1>Todos</h1>
      </div>

      <div class="ck-content contents">
        <div v-for="content in contentsWithTodos" v-bind:key="content.id">
          <content-link v-bind:content="content" />

          <ul class="todo-list">
            <li v-for="(todo, index) in content.todos" v-bind:key="index" v-html="formatTodo(todo)" />
          </ul>
        </div>
      </div>
    </div>
  </main>

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
  height: calc(100% - 65px);
  padding-top: 12px;
}

ul.todo-list {
  margin-left: 20px;
  margin-top: 5px;
  margin-bottom: 15px;
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
      return _.filter(this.contents, content => _.size(this.getCheckedTodos(content.todos)) > 0)
    }
  }, // computed

  methods: {
    formatTodo (todo) {
      if (_.isString(todo)) {
        return this.isChecked(todo) ? '' : todo
      }
      return ''
    },

    isChecked (todo) {
      return _.includes(todo, 'checked="checked"')
    },

    getCheckedTodos (todos) {
      return _.filter(todos, todo => this.isChecked(todo))
    }
  }
}
</script>
