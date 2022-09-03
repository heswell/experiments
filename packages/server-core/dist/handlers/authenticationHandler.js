import { uuid } from "../uuid.js";
import { TokenStore } from "../tokenStore.js";
function createCookie(options) {
  return `${options.name || ""}=${options.value || ""}` + (options.expires != null ? `; Expires=${options.expires.toUTCString()}` : "") + (options.maxAge != null ? `; Max-Age=${options.maxAge}` : "") + (options.domain != null ? `; Domain=${options.domain}` : "") + (options.path != null ? `; Path=${options.path}` : "") + (options.httpOnly ? "; HttpOnly" : "") + (options.sameSite != null ? `; SameSite=${options.sameSite}` : "") + (options.secure ? "; Secure" : "");
}
function handleAuthenticationRequest(request, response) {
  const { origin, "access-control-request-headers": requestHeaders } = request.headers;
  console.log(`origin = ${origin}`);
  if (request.method === "OPTIONS") {
    const headers = {
      "Access-Control-Allow-Credentials": true,
      "Access-Control-Allow-Headers": requestHeaders,
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "OPTIONS, POST, GET",
      "Access-Control-Max-Age": 14400
    };
    response.writeHead(204, headers);
    response.end();
  } else {
    let body = [];
    request.on("data", (chunk) => {
      body.push(chunk);
    }).on("end", () => {
      body = Buffer.concat(body).toString();
      console.log(`got an auth request ${body}`);
      const { username, password } = JSON.parse(body);
      const vuuAuthProp = "vuu-auth-token";
      const authToken = uuid();
      TokenStore.setToken(authToken, { name: username });
      const headers = {
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Origin": origin
      };
      var expiresTime = new Date();
      const four_hours = 4 * 60 * 60 * 1e3;
      expiresTime.setTime(expiresTime.getTime() + four_hours);
      headers[vuuAuthProp] = authToken;
      const cookie = createCookie({
        expires: expiresTime,
        maxAge: 14400,
        name: vuuAuthProp,
        sameSite: "None",
        secure: true,
        value: authToken
      });
      headers["set-cookie"] = cookie;
      console.log({ headers });
      response.writeHead(201, headers);
      response.end();
    });
  }
}
export {
  handleAuthenticationRequest
};
//# sourceMappingURL=authenticationHandler.js.map
