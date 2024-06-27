const puppeteer = require("puppeteer");
const {
  doLogin,
  getPublications,
  getTodayDate,
  savePdf,
  logOut,
} = require("./reader");

const main = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  const date = process.argv[2] || getTodayDate();
  const publicationId = process.argv[3] || "delhi";

  console.log("Logging in.... Please wait");
  await doLogin(page, {
    email: "hi@hi.com",
    password: "demodemo",
  });

  console.log("Feting publisher details... ");
  const publications = await getPublications(page, date);

  console.log("Saving pdf file....");
  await savePdf(
    await browser.newPage(),
    publications[`th_${publicationId}`],
    date,
    publicationId
  );
  //   await logOut(page);

  await page.close();
  await browser.close();
};

main();
