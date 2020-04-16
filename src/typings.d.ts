/* eslint-disable  */
declare module 'www-authenticate' {
  namespace wwwAuthenticate {
    namespace parsers {
      class WWW_Authenticate {
        readonly parms: Record<string, string>;
        constructor(auth: string);
      }
    }
  }
  export = wwwAuthenticate;
}

declare namespace NodeJS {
  interface Global {
    renovateCache: unknown;
    repoCache: unknown;
  }
}
