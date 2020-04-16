import Vue from 'vue'
import VueRouter from 'vue-router'

import Home from '@/views/Home.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import(/* webpackChunkName: "dashboard" */ '../views/Dashboard.vue'),
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
    component: () => import(/* webpackChunkName: "document" */ '../views/Document.vue'),
    meta: {
      requiresAuth: true
    }
  },

  {
    path: '/new/:id',
    name: 'NewDocument',
    component: () => import(/* webpackChunkName: "document" */ '../views/Document.vue'),
    meta: {
      requiresAuth: true
    }
  },

  {
    path: '/trash',
    name: 'Trash',
    component: () => import(/* webpackChunkName: "dashboard" */ '../views/Dashboard.vue'),
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
