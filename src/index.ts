// Node v16 is missing structuredClone, so we polyfill it here.
import 'core-js/actual/structured-clone';
import 'source-map-support/register';
import run from './runner';

run().catch(console.error);
