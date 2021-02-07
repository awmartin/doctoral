import { createRouter, createWebHashHistory } from 'vue-router';

import Home from '@/views/Home.vue'
import Tag from '@/views/Tag.vue'
import Trash from '@/views/Trash.vue'
import Archive from '@/views/Archive.vue'

let Document
let Dashboard

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
    path: '/tag/:id',
    name: 'Tag',
    component: Tag,
    meta: {
      requiresAuth: true
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
    component: Trash,
    meta: {
      requiresAuth: true
    }
  },

  {
    path: '/archive',
    name: 'Archive',
    component: Archive,
    meta: {
      requiresAuth: true
    }
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'Home',
    component: Home,
    meta: {
      requiresAuth: false
    }
  },
]

const router = createRouter({
  history: createWebHashHistory('/app/'),
  routes
})

export default router
