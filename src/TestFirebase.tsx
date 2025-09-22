import React, { useEffect } from 'react';

// console.log('TestFirebase: File loaded');

export default function TestFirebase() {
  // console.log('TestFirebase: Component rendering');
  
  useEffect(() => {
    // console.log('TestFirebase: useEffect running');
    
    // Test importing Firebase step by step
    const testFirebase = async () => {
      try {
        // console.log('TestFirebase: About to import firebase/app');
        const { initializeApp } = await import('firebase/app');
        // console.log('TestFirebase: firebase/app imported successfully');
        
        const firebaseConfig = {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_FIREBASE_APP_ID,
        };
        
        // console.log('TestFirebase: Config:', firebaseConfig);
        
        const app = initializeApp(firebaseConfig);
        // console.log('TestFirebase: App initialized:', app);
        
      } catch (error) {
        console.error('TestFirebase: Error during import/init:', error);
      }
    };
    
    testFirebase();
  }, []);
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Firebase Import</h1>
      <p>Check the console for Firebase import status</p>
    </div>
  );
}