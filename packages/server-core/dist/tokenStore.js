const sessions = /* @__PURE__ */ new Map();
const hasToken = (token) => sessions.has(token);
const setToken = (token, user) => {
  console.log(`store token ${token} for user ${user}`);
  sessions.set(token, user);
};
const setSession = (token, sessionId) => {
  const session = sessions.get(token);
  if (session) {
    session.sessionId = sessionId;
  } else {
    throw Error(`TokenStore cannot associate session ${sessionId} with token ${token}`);
  }
};
const TokenStore = {
  hasToken,
  setToken,
  setSession
};
export {
  TokenStore
};
//# sourceMappingURL=tokenStore.js.map
