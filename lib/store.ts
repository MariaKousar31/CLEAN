// lib/store.ts
// Global in-memory queue — survives hot reloads in dev

declare global {
  var __intents: any[];
}

if (!global.__intents) global.__intents = [];

export const store = {
  add: (intent: any) => {
    global.__intents.unshift(intent); // newest first
    if (global.__intents.length > 20) global.__intents.pop(); // cap at 20
  },
  getAll: () => global.__intents,
  clear: () => { global.__intents = []; },
};