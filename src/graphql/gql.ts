

export const schema = `
  type Query {
    add(x: Int, y: Int): Int
  }
`

const resolvers = {
  Query: {
    hello: () => 'Hello, world!',
  },
  Mutation: {
    setMessage: (_, { message }) => {
      return `Message received: ${message}`;
    },
  },
};

export const createGQLHandler = async (res, req) => {
res.graphql("hello world");
};