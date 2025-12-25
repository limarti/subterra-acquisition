import { createRouter, createMemoryHistory } from 'vue-router';
import DashboardView from './features/dashboard/DashboardView.vue';
import ProjectLayout from './features/projects/ProjectLayout.vue';
import ProjectMapView from './features/projects/ProjectMapView.vue';
import ProjectDetailsView from './features/projects/ProjectDetailsView.vue';
import ProjectAOIView from './features/projects/ProjectAOIView.vue';
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
      component: ProjectLayout,
      children: [
        {
          path: '',
          name: 'project',
          redirect: to => ({ name: 'project-map', params: { idProject: to.params.idProject } })
        },
        {
          path: 'map',
          name: 'project-map',
          component: ProjectMapView,
        },
        {
          path: 'details',
          name: 'project-details',
          component: ProjectDetailsView,
        },
        {
          path: 'aoi/:idAOI',
          name: 'project-aoi',
          component: ProjectAOIView,
        },
      ],
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
  ],
});

export default router;
