const SELECTORS = Object.freeze({
  loggedIn: '[data-auth="logged-in"]',
  loggedOut: '[data-auth="logged-out"]',
  anonymous: '[data-visibility="anonymous"]',
  authenticated: '[data-visibility="authenticated"]'
});

function setHidden(elements, hidden) {
  elements.forEach((element) => {
    element.hidden = hidden;
  });
}

export function createAuthView({ document = globalThis.document } = {}) {
  if (!document) {
    throw new Error('Document requerido para crear AuthView.');
  }

  const loggedInElements = [...document.querySelectorAll(SELECTORS.loggedIn)];
  const loggedOutElements = [...document.querySelectorAll(SELECTORS.loggedOut)];
  const anonymousElements = [...document.querySelectorAll(SELECTORS.anonymous)];
  const authenticatedElements = [...document.querySelectorAll(SELECTORS.authenticated)];

  return {
    render(user) {
      const isAuthenticated = Boolean(user);
      setHidden(loggedInElements, !isAuthenticated);
      setHidden(loggedOutElements, isAuthenticated);
      setHidden(anonymousElements, isAuthenticated);
      setHidden(authenticatedElements, !isAuthenticated);
    }
  };
}
