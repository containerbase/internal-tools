// Node v16 is missing structuredClone, so we polyfill it here.
import 'core-js/actual/structured-clone';
import run from './runner';

run().catch(console.error);
