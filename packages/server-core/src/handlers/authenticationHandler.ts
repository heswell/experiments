import { uuid } from '../uuid.js';
import { TokenStore } from '../tokenStore.js';

import { IncomingMessage, OutgoingHttpHeaders, ServerResponse } from 'http';

export interface CookieOptions {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  name: string;
  path?: string;
  sameSite?: 'Strict' | 'Lax' | 'None';
  secure?: boolean;
  value?: string;
}
function createCookie(options: CookieOptions): string {
  return (
    `${options.name || ''}=${options.value || ''}` +
    (options.expires != null ? `; Expires=${options.expires.toUTCString()}` : '') +
    (options.maxAge != null ? `; Max-Age=${options.maxAge}` : '') +
    (options.domain != null ? `; Domain=${options.domain}` : '') +
    (options.path != null ? `; Path=${options.path}` : '') +
    (options.httpOnly ? '; HttpOnly' : '') +
    (options.sameSite != null ? `; SameSite=${options.sameSite}` : '') +
    (options.secure ? '; Secure' : '')
  );
}

export function handleAuthenticationRequest(request: IncomingMessage, response: ServerResponse) {
  const { origin, 'access-control-request-headers': requestHeaders } = request.headers;
  console.log(`origin = ${origin}`);
  if (request.method === 'OPTIONS') {
    const headers: OutgoingHttpHeaders = {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': requestHeaders,
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
      'Access-Control-Max-Age': 14400 // 4 hours
    };

    response.writeHead(204, headers);
    response.end();
  } else {
    let body: string[] = [];
    request
      .on('data', (chunk) => {
        body.push(chunk.toString());
      })
      .on('end', () => {
        const { username, password } = JSON.parse(body.join());
        // DO wheverer we need to do here

        const vuuAuthProp = 'vuu-auth-token';
        const authToken = uuid();

        TokenStore.setToken(authToken, { name: username });

        const headers: OutgoingHttpHeaders = {
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Expose-Headers': 'vuu-auth-token',
          'Access-Control-Allow-Origin': origin
        };

        var expiresTime = new Date();
        const four_hours = 4 * 60 * 60 * 1000;
        expiresTime.setTime(expiresTime.getTime() + four_hours);

        headers[vuuAuthProp] = authToken;
        const cookie = createCookie({
          expires: expiresTime,
          maxAge: 14400,
          name: vuuAuthProp,
          sameSite: 'None',
          secure: true,
          value: authToken
        });
        // should we push this here ?
        headers['set-cookie'] = cookie;
        console.log(`actual request 
        ${JSON.stringify(requestHeaders, null, 2)} 
        ${JSON.stringify(headers, null, 2)}`);
        response.writeHead(201, headers);
        response.end();
      });
  }
}
