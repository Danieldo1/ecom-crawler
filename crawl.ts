import axios from "axios";
import * as cheerio from "cheerio";
import { RateLimit } from "async-sema";
import { MongoClient } from "mongodb";

const TARGET_WEBSITE = "https://www.modani.com";
const MAX_PRODUCTS = 5;
const RATE_LIMIT = 1;

// interface for product data
interface ProductData {
  url: string;
  title: string;
  currentPrice: string;
  originalPrice: string;
  description: {
    main: string;
    features: string;
    dimensions: string;
  };
}

//   getting the sitemap
async function fetchSitemap(url: string): Promise<string[]> {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data, { xmlMode: true });
  return $("loc")
    .map((_, el) => $(el).text())
    .get();
}
// getting the robots.txt
async function fetchRobotsTxt(url: string): Promise<string> {
    const response = await axios.get(`${url}/robots.txt`);
    return response.data;
  }

//   checking the url is a product
function isProductUrl(url: string): boolean {
  const parsedUrl = new URL(url);
  const pathSegments = parsedUrl.pathname
    .split("/")
    .filter((segment) => segment.length > 0);
    //only target urls with 5 segments the best way i found out to check if the url is a product NOTE: THIS COULD BE IMPROVED
  return pathSegments.length === 1 && pathSegments[0].split("-").length > 4;
}

//   getting the product data from the DOM
async function fetchProductData(url: string): Promise<ProductData | null> {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  // extract data from the DOM
  // extract title via custom attributes
  const title = $("h1.page-title span.base").text().trim();

  // extract current price via custom attributes
  const currentPrice = $(".special-price .price").first().text().trim();

  // extract original price via custom attributes
  const originalPrice = $(".old-price .price").first().text().trim();

  // extract description via custom attributes
  const description = {
    main: $(
      '.custom_product_attr_detail:contains("Description") .custom_product_attr_value'
    )
      .text()
      .trim(),
    features: $(
      '.custom_product_attr_detail:contains("Product Features") .custom_product_attr_value'
    )
      .text()
      .trim(),
    dimensions: $(
      '.custom_product_attr_detail:contains("Product Dimensions") .custom_product_attr_value'
    )
      .text()
      .trim(),
  };

  // validate data and return null if not valid
  if (!title || !currentPrice) {
    console.log(`Skipping ${url} - not a valid product page`);
    return null;
  }

  // return the product data object
  return {
    url,
    title,
    currentPrice,
    originalPrice,
    description,
  };
}

// storing the product data
async function storeProductData(product: ProductData, client: MongoClient) {
  const db = client.db("modani_crawler");
  const collection = db.collection("products");
  await collection.updateOne(
    { url: product.url },
    { $set: product },
    { upsert: true }
  );
}

async function main() {
  // connect to mongodb instance locally
  const client = new MongoClient("mongodb://localhost:27017");
  await client.connect();

  try {
    // getting the sitemap to find relavant products as robots txt doesnt have a way to do this
    const sitemapUrl = `${TARGET_WEBSITE}/sitemap.xml`;
    // getting the robots.txt for some reason
    const robotsTxt = await fetchRobotsTxt(TARGET_WEBSITE);
    console.log(`Robots.txt: ${robotsTxt}`);

    // checking the url is a product
    const allUrls = await fetchSitemap(sitemapUrl);
    const productUrls = allUrls.filter(isProductUrl);
    // applying the rate limit
    const limit = RateLimit(RATE_LIMIT);
    let productCount = 0;

    // loop through the product urls and rate limit ourselves
    for (const url of productUrls) {
      if (productCount >= MAX_PRODUCTS) break;

      await limit();

      try {
        // fetch the product data
        const productData = await fetchProductData(url);
        if (productData) {
          // store the product data
          await storeProductData(productData, client);
          productCount++;
          console.log(`Crawled and stored product: ${productData.title}`);
          console.log(
            `Description: ${JSON.stringify(productData.description, null, 2)}`
          );
        }
      } catch (error) {
        console.error(`Error crawling ${url}:`, error);
      }
    }
  } finally {
    // close mongodb connection
    await client.close();
  }
}

main().catch(console.error);
