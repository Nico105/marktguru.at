import axios from 'axios';
import * as marktguru from '../typings/index';

const defaultOptions: marktguru.SearchOptions = {
    limit: 1000,
    offset: 0,
    zipCode: 1010
};

/**
 * Get the keys to communicate with the marktguru api
 */
const getKeys = async (): Promise<{ apiKey: string; clientKey: string }> => {
    const regex = /<script\stype="application\/json">(.*?)<\/script>/gm;
    const { data } = await axios.get('https://marktguru.at');

    let m;
    let configStr: string = '';
    while ((m = regex.exec(data)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) regex.lastIndex++;

        // The result can be accessed through the `m`-variable.
        configStr = m[1];
    }

    if (configStr.length > 0) {
        const marktguruConfig = JSON.parse(configStr) as marktguru.Config;

        if (marktguruConfig) {
            return {
                apiKey: marktguruConfig.config.apiKey,
                clientKey: marktguruConfig.config.clientKey
            };
        } else {
            throw new Error('Could not parse remote data');
        }
    } else {
        throw new Error('No remote data');
    }
};

/**
 * Get the created axios client
 */
const getClient = async () => {
    const keys = await getKeys();

    return axios.create({
        baseURL: 'https://api.marktguru.at/api/v1',
        headers: {
            'x-apikey': keys.apiKey,
            'x-clientkey': keys.clientKey
        }
    });
};

/**
 * Search for any products
 * @param {String} query
 * @param {marktguru.SearchOptions} options
 */
export const search = async (query: string = '', options: marktguru.SearchOptions = {}): Promise<marktguru.Offer[]> => {
    // Format retailer names in the right format
    options.allowedRetailers = options.allowedRetailers?.map((r) => r.toLowerCase().trim().replace(/\s+/g, '-'));

    const opts = { ...defaultOptions, ...options };

    const client = await getClient();

    const res = await client.get('offers/search', {
        params: {
            as: 'web',
            q: query,
            ...opts
        }
    });

    let offers = res.data.results as marktguru.Offer[];

    if (opts.allowedRetailers !== undefined) {
        offers = offers.filter((offer: marktguru.Offer) => {
            return offer.advertisers.find((advertiser: marktguru.Advertiser) => {
                return (opts.allowedRetailers as marktguru.Retailer[]).includes(advertiser.uniqueName);
            });
        });
    }

    return offers.map((offer) => ({
        ...offer,
        images: {
            ...offer.images,
            urls: {
                small: `https://mgat.b-cdn.net/api/v1/offers/${offer.id}/images/default/0/small.jpg`,
                medium: `https://mgat.b-cdn.net/api/v1/offers/${offer.id}/images/default/0/medium.jpg`,
                large: `https://mgat.b-cdn.net/api/v1/offers/${offer.id}/images/default/0/large.jpg`
            }
        }
    }));
};
