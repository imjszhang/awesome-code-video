import React from 'react';
import {createRoot,hydrateRoot} from 'react-dom/client';
import {App} from './App';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/jetbrains-mono';
import './styles.css';
const root=document.getElementById('root')!;
const app=<App path={window.location.pathname} base={import.meta.env.BASE_URL}/>;
if(root.hasChildNodes())hydrateRoot(root,app);else createRoot(root).render(app);
