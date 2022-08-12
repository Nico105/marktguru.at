"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.search = void 0;
const axios_1 = __importDefault(require("axios"));
const defaultOptions = {
    limit: 1000,
    offset: 0,
    zipCode: 1010
};
/**
 * Get the keys to communicate with the marktguru api
 */
const getKeys = async () => {
    const regex = /<script\stype="application\/json">(.*?)<\/script>/gm;
    const { data } = await axios_1.default.get('https://marktguru.at');
    let m;
    let configStr = '';
    while ((m = regex.exec(data)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex)
            regex.lastIndex++;
        // The result can be accessed through the `m`-variable.
        configStr = m[1];
    }
    if (configStr.length > 0) {
        const marktguruConfig = JSON.parse(configStr);
        if (marktguruConfig) {
            return {
                apiKey: marktguruConfig.config.apiKey,
                clientKey: marktguruConfig.config.clientKey
            };
        }
        else {
            throw new Error('Could not parse remote data');
        }
    }
    else {
        throw new Error('No remote data');
    }
};
/**
 * Get the created axios client
 */
const getClient = async () => {
    const keys = await getKeys();
    return axios_1.default.create({
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
const search = async (query = '', options = {}) => {
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
    let offers = res.data.results;
    if (opts.allowedRetailers !== undefined) {
        offers = offers.filter((offer) => {
            return offer.advertisers.find((advertiser) => {
                return opts.allowedRetailers.includes(advertiser.uniqueName);
            });
        });
    }
    return offers.map((offer) => ({
        ...offer,
        images: {
            ...offer.images,
            urls: {
                small: `https://mg2de.b-cdn.net/api/v1/offers/${offer.id}/images/default/0/small.jpg`,
                medium: `https://mg2de.b-cdn.net/api/v1/offers/${offer.id}/images/default/0/medium.jpg`,
                large: `https://mg2de.b-cdn.net/api/v1/offers/${offer.id}/images/default/0/large.jpg`
            }
        }
    }));
};
exports.search = search;
