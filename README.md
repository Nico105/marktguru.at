# Unofficial Marktguru library

A library to search for offers on [marktguru.at](https://marktguru.at).

Heavily inspired by [marktguru](https://github.com/sydev/marktguru).

## Usage

```ts
import { search } from 'marktguru.at';

(async () => {
    try {
        const query = 'Cola';
        const offers = await search(query, { limit: 10 });
        console.log(offers);
    } catch (error) {
        // error is an axios error, see https://axios-http.com/docs/handling_errors for more infos
        console.error(error);
    }
})();
```

### Search Options

| Key              | Description                                                                        | Default |
| ---------------- | ---------------------------------------------------------------------------------- | ------- |
| limit            | Set the limit of offers to receive                                                 | 1000    |
| offset           | Skip as many offers as offset is set                                               | 0       |
| allowedRetailers | An array of retailers. See [here](src/@types/marktguru.d.ts#L2) for some retailers | []      |
| zipCode          | The zip code of area/city where to search for offers                               | 1010    |

### Returned data

How an returned offer object looks like, you can see [here](src/@types/marktguru.d.ts#L89).
