import Vue from 'vue'
import VueRouter from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Document from '../views/Document.vue'
import Login from '@/components/Login.vue'

const fb = require('../firebase.js')
const _ = require('lodash')

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: {
      requiresAuth: true
    }
  },

  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue'),
    meta: {
      requiresAuth: false
    }
  },

  {
    path: '/login',
    name: 'Login',
    component: Login
  },

  {
    path: '/doc/:id',
    name: 'Document',
    component: Document,
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

  if (requiresAuth && !isLoggedIn) {
    next('/login')
  } else if (requiresAuth && isLoggedIn) {
    // Regular application pages which require authentication.
    next()
  } else {
    // Public page. Doesn't require the user to be logged in.
    next()
  }
})

export default router
