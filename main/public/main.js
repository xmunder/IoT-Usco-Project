import { bootstrapDashboard } from './scripts/app/bootstrap.js';
import { showMessage } from './scripts/showmessage.js';

const errorElement = document.querySelector('[data-app-error]');

bootstrapDashboard().catch((error) => {
  console.error('Dashboard bootstrap failed:', error);

  if (errorElement) {
    errorElement.hidden = false;
    errorElement.textContent = error?.message ?? 'No se pudo inicializar el dashboard.';
  }

  showMessage(error?.message ?? 'No se pudo inicializar el dashboard.', 'error');
});
