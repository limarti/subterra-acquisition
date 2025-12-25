import './assets/base.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';
import { createFileManagerPlugin } from './services/files/fileVuePlugin';
import { createBluetoothPlugin } from './services/bluetooth/createBluetoothPlugin';
import { createGpsPlugin } from './services/gps/gpsVuePlugin';
import { useAppWakeLock } from '@/common/composables/useAppWakeLock';
import i18n from '@/common/localization/i18n';

const app = createApp(App);

app.use(i18n);
app.use(createPinia());
app.use(router);
app.use(createFileManagerPlugin());
app.use(createBluetoothPlugin());
app.use(createGpsPlugin());

app.mount('#app');

useAppWakeLock();
