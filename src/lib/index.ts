import util from 'node:util';

export const printDetail = (obj: unknown) => {
  console.log(util.inspect(obj), {
    depth: null,
    colors: true,
    maxArrayLength: null,
    maxStringLength: null,
    compact: false,
  });
};
