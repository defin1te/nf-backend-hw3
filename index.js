const express = require("express");
const puppeteer = require("puppeteer");
const cron = require("node-cron");

const app = express();
const PORT = process.env.PORT || 3000;
let currentPage = 1;

async function scrapeBooks(pageNumber) {
  const url = `https://books.toscrape.com/catalogue/page-${pageNumber}.html`;

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    const books = await page.evaluate(() => {
      const headings_elements = document.querySelectorAll(".product_pod");
      const headings_array = Array.from(headings_elements);
      return headings_array.map((heading) => {
        return {
          name: heading.querySelector("h3 a").textContent.trim(),
          price: heading
            .querySelector(".product_price .price_color")
            .textContent.trim(),
          availability: heading.querySelector(".instock").textContent.trim(),
        };
      });
    });

    await browser.close();
    console.log(`Page ${pageNumber}:`, books);
    return books;
  } catch (error) {
    console.error(`Error on page ${pageNumber}:`, error);
    return [];
  }
}

cron.schedule("*/40 * * * *", async () => {
  console.log(`Running the scrapeBooks job for page ${currentPage}...`);
  const books = await scrapeBooks(currentPage);
  if (books.length > 0) {
    currentPage++;
  } else {
    console.log("No more pages to scrape.");
  }
});

(async () => {
  console.log("Running the scrapeBooks job at server startup...");
  const books = await scrapeBooks(currentPage);
  if (books.length > 0) {
    currentPage++;
  }
})();

app.get("/scrape-books", async (req, res) => {
  const books = await scrapeBooks(currentPage);
  res.json(books);
  if (books.length > 0) {
    currentPage++;
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
