// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB4M9RcUh1Vv18B63UVnnZYaOtj-RT_FEM",
    authDomain: "sistema-de-solicitudes-d1b70.firebaseapp.com",
    databaseURL: "https://sistema-de-solicitudes-d1b70-default-rtdb.firebaseio.com",
    projectId: "sistema-de-solicitudes-d1b70",
    storageBucket: "sistema-de-solicitudes-d1b70.firebasestorage.app",
    messagingSenderId: "906171362204",
    appId: "1:906171362204:web:0386887ab9e36b523f3659"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referencia a la base de datos
const database = firebase.database();
const solicitudesRef = database.ref('solicitudes');
