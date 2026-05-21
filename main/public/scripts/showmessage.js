function logFallback(message, type) {
  const logger = type === 'error' ? console.error : console.log;
  logger(message);
}

function getAlertVariant(type) {
  return type === 'error' ? 'danger' : 'success';
}

function getAlertIcon(type) {
  return type === 'error' ? 'exclamation-octagon' : 'check-circle';
}

function createToastAlert(document, message, type) {
  const alert = document.createElement('sl-alert');
  const icon = document.createElement('sl-icon');
  const text = document.createElement('span');

  alert.variant = getAlertVariant(type);
  alert.closable = true;
  alert.duration = 3000;

  icon.setAttribute('slot', 'icon');
  icon.setAttribute('name', getAlertIcon(type));
  text.textContent = message;

  alert.append(icon, text);
  return alert;
}

export function showMessage(message, type = 'success', { document = globalThis.document } = {}) {
  if (!document?.body) {
    logFallback(message, type);
    return;
  }

  const alert = createToastAlert(document, message, type);
  document.body.append(alert);

  if (typeof alert.toast !== 'function') {
    alert.remove();
    logFallback(message, type);
    return;
  }

  alert.addEventListener('sl-after-hide', () => alert.remove(), { once: true });

  try {
    alert.toast();
  } catch (error) {
    alert.remove();
    logFallback(message, type);
    console.error(error);
  }
}
