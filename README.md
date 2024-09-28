# Modani Product Crawler

This project is a web crawler designed to extract product information from the[ Modani furniture website ](https://www.modani.com). I used TypeScript and Node.js to crawl the website, extract product details via DOM attributes, and store them in a MongoDB database.

## Prerequisites

Before you begin, ensure the following requirements:

- You have a MacBook
- You have [Homebrew](https://brew.sh/)
- You have [Node.js](https://nodejs.org/)

## Setting up MongoDB locally

1. Install MongoDB using Homebrew:

   ```
   brew tap mongodb/brew
   brew install mongodb-community@7.0
   ```

2. Start the MongoDB service:

   ```
   brew services start mongodb-community@7.0
   ```

3. Verify that MongoDB is running:

   ```
   brew services list
   ```

   You should see `mongodb-community@7.0` Status User `started`.

## When you're done using MongoDB, you can stop the service:

1. Stop the MongoDB service using Homebrew:

```
brew services stop mongodb-community@7.0
```

2. Verify that MongoDB has stopped:

```
brew services list
```

- You should now see mongodb-community@7.0 Status User `none`

## Installing the Crawler

1. Clone this repository
```
git clone https://github.com/Danieldo1/ecom-crawler.git
```


2. Navigate to the project directory:

   ```
   cd ecom-crawler
   ```

3. Install the required npm packages:
   ```
   npm install axios cheerio async-sema mongodb
   npm install --save-dev typescript @types/node @types/cheerio @types/mongodb ts-node
   ```

## Configuring the Crawler

1. Open directory in a text editor VSCode (simply drag and drop it or type in terminal code .)
## Running the Crawler

1. Ensure MongoDB is running.

2. Run the crawler:

   ```
   npx ts-node crawler.ts
   ```

3. The crawler will start running, and you'll see output in the terminal of text editor indicating which products have been crawled and stored.

## Viewing the Results

1. Open the MongoDB shell:

   ```
   mongosh
   ```

2. Switch to the crawler database:

   ```
   use modani_crawler
   ```

3. View the crawled products:
   ```
   db.products.find()
   ```


## Disclaimer

This crawler is for educational purposes only. Always ensure you have permission to crawl a website and that you comply with the website's robots.txt file and terms of service.
