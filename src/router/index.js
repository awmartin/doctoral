import Vue from 'vue'
import VueRouter from 'vue-router'

import Home from '@/components/Home.vue'

const fb = require('../firebase.js')
const _ = require('lodash')

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
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(x => x.meta.requiresAuth)
  const currentUser = fb.getCurrentUser()
  const isLoggedIn = !_.isNil(currentUser) // This is much faster than store.getters.isLoggedIn. Seems to be sufficient.

  if (to.name === from.name && _.isEqual(to.params, from.params)) { return }

  if (requiresAuth && !isLoggedIn) {
    next('/')
  } else if (requiresAuth && isLoggedIn) {
    // Regular application pages which require authentication.
    next()
  } else {
    // Public page. Doesn't require the user to be logged in.
    next()
  }
})

export default router
