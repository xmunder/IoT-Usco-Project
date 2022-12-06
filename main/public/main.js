import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-auth.js"
import { auth, app} from "./scripts/firebase.js"
import { loginCheck } from "./scripts/logincheck.js"
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js"
import './scripts/firebase.js'
import './scripts/logout.js'
import './scripts/signin.js'
import { g , g1, g2, g3, g4, g5 } from "./scripts/guage.js";

const tempElement = document.getElementById("temp");
const humElement = document.getElementById("hum");
const distElement = document.getElementById("dist")
const co2Element = document.getElementById("co2");
const alcoholElement = document.getElementById("alcohol");
const coElement = document.getElementById("co");

onAuthStateChanged(auth, async (user) =>{
    loginCheck(user)
    if (user){
        var uid = user.uid;
        console.log(uid);
        const db = getDatabase(app)
        
        //Lectura de datos de temperatura
        const humRef = ref(db, 'UsersData/'+ uid.toString() + '/humidity');
        onValue(humRef, (snapshot) => {
          const data = snapshot.val();
          humElement.innerText = snapshot.val().toFixed(2);
          g.refresh(data);
        })
        const tempRef = ref(db, 'UsersData/'+ uid.toString() + '/temperature');
        onValue(tempRef, (snapshot) => {
          const data = snapshot.val();
          tempElement.innerText = snapshot.val().toFixed(2);
          g1.refresh(data);
        });        
        const distRef = ref(db, 'UsersData/'+ uid.toString() + '/distance');
        onValue(distRef, (snapshot) => {
          const data = snapshot.val();
          distElement.innerText = snapshot.val().toFixed(2);
          g2.refresh(data);
        })
        const co2Ref = ref(db, 'UsersData/'+ uid.toString() + '/co2');
        onValue(co2Ref, (snapshot) => {
          const data = snapshot.val();
          co2Element.innerText = snapshot.val().toFixed(2);
          g3.refresh(data);
        })
        const alcoholRef = ref(db, 'UsersData/'+ uid.toString() + '/alcohol');
        onValue(alcoholRef, (snapshot) => {
          const data = snapshot.val();
          alcoholElement.innerText = snapshot.val().toFixed(2);
          g4.refresh(data);
        })
        const coRef = ref(db, 'UsersData/'+ uid.toString() + '/co');
        onValue(coRef, (snapshot) => {
          const data = snapshot.val();
          coElement.innerText = snapshot.val().toFixed(2);
          g5.refresh(data);
        })

        //Boton de encendido y apagado
        function on() {
          set(ref(db, 'UsersData/' + uid.toString() + '/toggleStatus' ),{
            status: "ON"
          });
          document.getElementById("led1").setAttribute("stop-color", "#ff0000");
        }
        window.on = on;
        function off() {
          set(ref(db, 'UsersData/' + uid.toString() + '/toggleStatus' ),{
            status: "OFF"
          });
          document.getElementById("led1").setAttribute("stop-color", "#110000");
        }
        window.off = off;
    }
})
