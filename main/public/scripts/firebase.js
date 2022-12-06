  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
  import { getAuth} from "https://www.gstatic.com/firebasejs/9.14.0/firebase-auth.js"
  import { getDatabase } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js"
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries
  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyCUc80qnnpCK_McrFzRf5qABGWqDilYwfk",
    authDomain: "iot-usco-project.firebaseapp.com",
    projectId: "iot-usco-project",
    storageBucket: "iot-usco-project.appspot.com",
    messagingSenderId: "643964837149",
    appId: "1:643964837149:web:2c9e16552affef8186d5f4",
    measurementId: "G-PE3GQ20LZ1",
    databaseURL: "https://iot-usco-project-default-rtdb.firebaseio.com"
  };
  // Initialize Firebase
  export const app = initializeApp(firebaseConfig);
  export const db = getDatabase(app);
  export const auth = getAuth(app);