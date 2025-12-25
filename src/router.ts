import { createRouter, createMemoryHistory } from 'vue-router';
import WelcomeView from './features/WelcomeView.vue';
import DashboardView from './features/dashboard/DashboardView.vue';
import ProjectView from './features/projects/ProjectView.vue';
import ProjectListView from './features/projects/ProjectListView.vue';
import SettingsView from './features/settings/SettingsView.vue';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      name: 'welcome',
      component: WelcomeView,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/projects',
      name: 'project-list',
      component: ProjectListView,
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
