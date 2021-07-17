import { ApolloClient, createHttpLink, InMemoryCache, gql } from "@apollo/client"
import { setContext } from "@apollo/client/link/context";

const httpLink = createHttpLink({
    uri: "https://uqntqqwju5h3xdqm7uj7ekpkda.appsync-api.eu-west-1.amazonaws.com/graphql",
});

const authLink = setContext((_, { headers }) => {
    const token = process.env.API_KEY;

    console.log(token);

    return {
        headers: {
            ...headers,
            "x-api-key": token || "",
        },
    };
});

const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache()
});

// const data = {
//   home: {
//         title: "Hello World!",
//         description: "", 
//   } 
// };

async function fetchData(query) {
    const { loading, data } = await client.query({
        query: gql `
        query MyQuery {
          getPage(docId: "1") {
            id
            title
          }
        }
        
      `
    });
    console.log(data)

    return data;
}

export async function getTitleForHome(preview) {
    const home = await fetchData("home");
    return home.title;
}

export default client
