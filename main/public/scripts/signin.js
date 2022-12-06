import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-auth.js"

import { auth } from "./firebase.js"
import { showMessage } from "./showmessage.js";

const signInForm = document.querySelector('#login-form')

signInForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = signInForm['login-email'] .value;
    const password = signInForm['login-password'] .value;

    try {
        const usercredential = await signInWithEmailAndPassword(auth, email, password)
        showMessage('Ingreso correctamente')
        //cerrar modal
        const modal = bootstrap.Modal.getInstance(signInForm.closest('.modal'));
        modal.hide();
        //borrar datos del modal
        signInForm.reset();  
    } catch (error) {
        if (error.code === "auth/wrong-password"){
            showMessage('Contraseña incorrecta', 'error')
        } else if (error.code ==="auth/user-not-found"){
            showMessage('Usuario NO encontrado', 'error')
        } else {
            showMessage(error.message,'error')
        }
    }
})