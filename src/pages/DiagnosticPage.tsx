import { useState, useEffect } from 'react';
import {
  getFirebaseDb,
  getFirebaseAuth,
  getFirebaseStatus,
  testFirestoreConnectivity
} from '../config/firebase';
import { collection, doc, getDoc, setDoc, onSnapshot, enableNetwork, disableNetwork } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

export function DiagnosticPage() {
  const [status, setStatus] = useState<any>({});
  const [tests, setTests] = useState<{[key: string]: string}>({});
  const [networkStatus, setNetworkStatus] = useState('unknown');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  useEffect(() => {
    // Get initial status
    const firebaseStatus = getFirebaseStatus();
    setStatus(firebaseStatus);
    addLog('Firebase Status: ' + JSON.stringify(firebaseStatus));

    // Test connectivity
    testFirestoreConnectivity().then((result) => {
      addLog(`Connectivity test: ${result ? 'PASSED' : 'FAILED'}`);
    });
  }, []);

  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    setTests(prev => ({ ...prev, [testName]: 'running' }));
    addLog(`Starting test: ${testName}`);
    try {
      await testFn();
      setTests(prev => ({ ...prev, [testName]: 'passed' }));
      addLog(`✅ ${testName}: PASSED`);
    } catch (error: any) {
      setTests(prev => ({ ...prev, [testName]: 'failed' }));
      addLog(`❌ ${testName}: FAILED - ${error.message}`);
      console.error(`Test ${testName} failed:`, error);
    }
  };

  const testAnonymousAuth = async () => {
    const auth = getFirebaseAuth();
    const result = await signInAnonymously(auth);
    if (!result.user) throw new Error('No user returned');
    addLog(`Auth successful, UID: ${result.user.uid}`);
  };

  const testFirestoreRead = async () => {
    const db = getFirebaseDb();
    const testDoc = doc(db, 'test', 'diagnostic');
    const snapshot = await getDoc(testDoc);
    addLog(`Document exists: ${snapshot.exists()}`);
  };

  const testFirestoreWrite = async () => {
    const db = getFirebaseDb();
    const testDoc = doc(db, 'test', `diagnostic-${Date.now()}`);
    await setDoc(testDoc, {
      timestamp: new Date().toISOString(),
      test: true
    });
    addLog('Write successful');
  };

  const testRealtimeListener = async () => {
    const db = getFirebaseDb();
    const testDoc = doc(db, 'test', 'realtime');

    return new Promise<void>((resolve, reject) => {
      const unsubscribe = onSnapshot(
        testDoc,
        (snapshot) => {
          addLog(`Realtime update received: ${snapshot.exists()}`);
          unsubscribe();
          resolve();
        },
        (error) => {
          addLog(`Realtime error: ${error.message}`);
          unsubscribe();
          reject(error);
        }
      );

      // Give it 5 seconds to connect
      setTimeout(() => {
        unsubscribe();
        resolve();
      }, 5000);
    });
  };

  const toggleNetwork = async () => {
    const db = getFirebaseDb();
    if (networkStatus === 'online' || networkStatus === 'unknown') {
      await disableNetwork(db);
      setNetworkStatus('offline');
      addLog('Network disabled');
    } else {
      await enableNetwork(db);
      setNetworkStatus('online');
      addLog('Network enabled');
    }
  };

  const runAllTests = async () => {
    await runTest('Anonymous Auth', testAnonymousAuth);
    await runTest('Firestore Read', testFirestoreRead);
    await runTest('Firestore Write', testFirestoreWrite);
    await runTest('Realtime Listener', testRealtimeListener);
  };

  const getTestIcon = (status?: string) => {
    if (!status) return '⏸';
    if (status === 'running') return '⏳';
    if (status === 'passed') return '✅';
    return '❌';
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Firebase Diagnostic Page</h1>

      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Firebase Configuration</h2>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(status, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Network Control</h2>
        <button
          onClick={toggleNetwork}
          className={`px-4 py-2 rounded ${
            networkStatus === 'online' ? 'bg-green-500' :
            networkStatus === 'offline' ? 'bg-red-500' : 'bg-gray-500'
          } text-white`}
        >
          Network: {networkStatus}
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Diagnostic Tests</h2>
        <button
          onClick={runAllTests}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Run All Tests
        </button>

        <div className="space-y-2">
          <div className="flex items-center">
            <span className="mr-2">{getTestIcon(tests['Anonymous Auth'])}</span>
            <button
              onClick={() => runTest('Anonymous Auth', testAnonymousAuth)}
              className="text-blue-600 hover:underline"
            >
              Test Anonymous Auth
            </button>
          </div>
          <div className="flex items-center">
            <span className="mr-2">{getTestIcon(tests['Firestore Read'])}</span>
            <button
              onClick={() => runTest('Firestore Read', testFirestoreRead)}
              className="text-blue-600 hover:underline"
            >
              Test Firestore Read
            </button>
          </div>
          <div className="flex items-center">
            <span className="mr-2">{getTestIcon(tests['Firestore Write'])}</span>
            <button
              onClick={() => runTest('Firestore Write', testFirestoreWrite)}
              className="text-blue-600 hover:underline"
            >
              Test Firestore Write
            </button>
          </div>
          <div className="flex items-center">
            <span className="mr-2">{getTestIcon(tests['Realtime Listener'])}</span>
            <button
              onClick={() => runTest('Realtime Listener', testRealtimeListener)}
              className="text-blue-600 hover:underline"
            >
              Test Realtime Listener
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Console Logs</h2>
        <div className="bg-black text-green-400 p-4 rounded font-mono text-xs h-64 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>

      <div className="text-sm text-gray-600">
        <p>Open browser DevTools Network tab to see Firebase/Firestore requests.</p>
        <p>Add ?debug=true to URL to enable debug logging.</p>
      </div>
    </div>
  );
}