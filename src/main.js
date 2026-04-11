/**
 * Entry point: mounts the Svelte app into #app.
 */

import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';

const app = mount(App, { target: document.getElementById('app') });

export default app;
