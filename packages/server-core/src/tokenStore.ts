const sessions = new Map();

const hasToken = (token: string) => sessions.has(token);

const setToken = (token: string, user: any) => {
  console.log(`store token ${token} for user ${user}`);
  sessions.set(token, user);
};

const setSession = (token: string, sessionId: string) => {
  const session = sessions.get(token);
  if (session) {
    session.sessionId = sessionId;
  } else {
    throw Error(`TokenStore cannot associate session ${sessionId} with token ${token}`);
  }
};

export const TokenStore = {
  hasToken,
  setToken,
  setSession
};
