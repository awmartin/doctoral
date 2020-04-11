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
    path: '/about',
    name: 'About',
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue'),
    meta: {
      requiresAuth: false
    }
  },

  {
    path: '/',
    name: 'Home',
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
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
