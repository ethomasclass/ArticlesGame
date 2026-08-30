/* =========================================================================
   THE CONFEDERATION PROBLEM — the only file you need to edit

   1. In Supabase: Project Settings -> API
   2. Copy "Project URL" into url below
   3. Copy the "anon public" key into anonKey below
   4. Save. That's it.

   The anon key is meant to be public — it is designed to sit in a web page.
   Never paste the "service_role" key here; that one is an admin key.
   ========================================================================= */
window.AOC_CONFIG = {

  // "supabase" or "firebase"
  backend: "supabase",

  supabase: {
    url:     "PASTE_YOUR_PROJECT_URL_HERE",     // https://xxxxxxxx.supabase.co
    anonKey: "PASTE_YOUR_ANON_PUBLIC_KEY_HERE"
  },

  // Kept so the original Firebase project still works if you switch back.
  firebase: {
    apiKey: "AIzaSyBrgnposdt3upVeXZtu5g0EW0orEmyVy7I",
    authDomain: "articles-of-confederation-game.firebaseapp.com",
    projectId: "articles-of-confederation-game",
    storageBucket: "articles-of-confederation-game.appspot.com",
    messagingSenderId: "506849426036",
    appId: "1:506849426036:web:9e2f35f8ef29fda05def21"
  }
};
