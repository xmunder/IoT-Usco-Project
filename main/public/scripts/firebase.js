const FIREBASE_SDK_VERSION = '9.14.0';
const REQUIRED_FIREBASE_KEYS = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
  'databaseURL'
];

function readFirebaseTestFactory() {
  const hooks = globalThis.window?.__IOT_USCO_TEST_HOOKS__ ?? globalThis.__IOT_USCO_TEST_HOOKS__;
  return hooks?.createFirebaseBrowserClient;
}

function readFirebaseConfig(config = globalThis.window?.FIREBASE_CONFIG ?? globalThis.FIREBASE_CONFIG) {
  if (!config) {
    throw new Error('Falta window.FIREBASE_CONFIG. Copiá main/public/config.example.js a main/public/config.js y completalo.');
  }

  const missingKeys = REQUIRED_FIREBASE_KEYS.filter((key) => !config[key]);
  if (missingKeys.length > 0) {
    throw new Error(`Configuración Firebase incompleta. Faltan: ${missingKeys.join(', ')}`);
  }

  return config;
}

export async function createFirebaseBrowserClient({ config } = {}) {
  const testFactory = readFirebaseTestFactory();
  if (typeof testFactory === 'function') {
    return testFactory({ config });
  }

  const resolvedConfig = readFirebaseConfig(config);
  const [{ initializeApp }, authModule, databaseModule] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-database.js`)
  ]);

  const app = initializeApp(resolvedConfig);
  const auth = authModule.getAuth(app);
  const db = databaseModule.getDatabase(app);

  return {
    app,
    auth,
    db,
    onAuthStateChanged(callback) {
      return authModule.onAuthStateChanged(auth, callback);
    },
    signIn(email, password) {
      return authModule.signInWithEmailAndPassword(auth, email, password);
    },
    signOut() {
      return authModule.signOut(auth);
    },
    subscribe(path, onReading) {
      const reference = databaseModule.ref(db, path);
      return databaseModule.onValue(reference, (snapshot) => {
        onReading(snapshot.val(), snapshot);
      });
    },
    async get(path) {
      const reference = databaseModule.ref(db, path);
      const snapshot = await databaseModule.get(reference);
      return snapshot.val();
    },
    set(path, value) {
      const reference = databaseModule.ref(db, path);
      return databaseModule.set(reference, value);
    }
  };
}
