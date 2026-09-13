const firebaseConfig = {
  apiKey: "«reda…»",
  authDomain: "pokemon-box-manager.firebaseapp.com",
  projectId: "pokemon-box-manager",
  storageBucket: "pokemon-box-manager.firebasestorage.app",
  messagingSenderId: "645423843887",
  appId: "1:645423843887:web:c7290dc720a05791e9d4da",
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(app);

// App Check with reCAPTCHA Enterprise (score-based, invisible)
// IMPORTANT: reCAPTCHA Enterprise requires ReCaptchaEnterpriseProvider,
// NOT a bare site key string (the string form was the old reCAPTCHA v3 pattern)
// Disabled in CI/Playwright environments (navigator.webdriver is set by automated browsers)
const RECAPTCHA_SITE_KEY = "6LdosrktAAAAANmSkeEtmHEBP_J4u4Eb6nVnBaM0";
if (!navigator.webdriver) {
  firebase
    .appCheck()
    .activate(new firebase.appCheck.ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY), true);
}
