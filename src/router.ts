import { createRouter, createMemoryHistory } from 'vue-router';
import DashboardView from './features/dashboard/DashboardView.vue';
import ProjectView from './features/projects/ProjectView.vue';
import SettingsView from './features/settings/SettingsView.vue';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/project/:idProject',
      name: 'project',
      component: ProjectView,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/AboutView.vue'),
    // },
  ],
});

export default router;
