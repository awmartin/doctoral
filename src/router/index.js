import Vue from 'vue'
import VueRouter from 'vue-router'

import Home from '@/views/Home.vue'

let Document
let Dashboard

Vue.use(VueRouter)

const routes = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => {
      Dashboard = Dashboard ? Dashboard : import(/* webpackChunkName: "core" */ '../views/Dashboard.vue')
      Document = Document ? Document : import(/* webpackChunkName: "core" */ '../views/Document.vue')
      return Dashboard
    },
    meta: {
      requiresAuth: true
    }
  },

  {
    path: '/login',
    name: 'Login',
    component: Home,
    meta: {
      requiresAuth: false
    }
  },

  {
    path: '/doc/:id',
    name: 'Document',
    component: () => {
      Dashboard = Dashboard ? Dashboard : import(/* webpackChunkName: "core" */ '../views/Dashboard.vue')
      Document = Document ? Document : import(/* webpackChunkName: "core" */ '../views/Document.vue')
      return Document
    },
    meta: {
      requiresAuth: true
    }
  },

  {
    path: '/new/:id',
    name: 'NewDocument',
    component: () => { 
      Dashboard = Dashboard ? Dashboard : import(/* webpackChunkName: "core" */ '../views/Dashboard.vue')
      Document = Document ? Document : import(/* webpackChunkName: "core" */ '../views/Document.vue')
      return Document
    },
    meta: {
      requiresAuth: true
    }
  },

  {
    path: '/search/:id',
    name: 'Search',
    component: () => {
      Dashboard = Dashboard ? Dashboard : import(/* webpackChunkName: "app" */ '../views/Dashboard.vue')
      Document = Document ? Document : import(/* webpackChunkName: "app" */ '../views/Document.vue')
      return Document
    },
    meta: {
      requiresAuth: true
    }
  },

  {
    path: '/trash',
    name: 'Trash',
    component: () => {
      Dashboard = Dashboard ? Dashboard : import(/* webpackChunkName: "app" */ '../views/Dashboard.vue')
      Document = Document ? Document : import(/* webpackChunkName: "app" */ '../views/Document.vue')
      return Dashboard
    },
    meta: {
      requiresAuth: true
    }
  },

  {
    path: '*',
    name: 'Home',
    component: Home,
    meta: {
      requiresAuth: false
    }
  },
]

const router = new VueRouter({
  mode: 'hash',
  base: '/app/',
  routes
})

export default router
