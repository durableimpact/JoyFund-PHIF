# Frontend 

```bash
npm install firebase
```

```js
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBMESLUlTuVBtPujomgggfKf6_Yto5i5AI",
  authDomain: "joyfund-14e7e.firebaseapp.com",
  projectId: "joyfund-14e7e",
  storageBucket: "joyfund-14e7e.firebasestorage.app",
  messagingSenderId: "819910116047",
  appId: "1:819910116047:web:43a3cea74d4c44a28b2dba",
  measurementId: "G-XYBNHE5J4B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
```


```env
NEXT_PUBLIC_FIREBASE_API_KEY=uelcLAzNNQ1DNIpDOlP0q4-JrgbOYL9PpuzIPDrWq00
```