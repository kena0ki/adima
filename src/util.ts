
export const global = Function('return this')();

export const logger = {
  log: global.isDevelopment ? console.log : () => {},
}

