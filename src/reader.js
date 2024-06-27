const { join, resolve } = require("path");
const fs = require("fs");
const os = require("os");
const pfdkit = require("pdfkit");

async function doLogin(page, credentials) {
  const { email, password } = credentials;
  try {
    page.goto("https://epaper.thehindu.com/reader", {
      waitUntil: "domcontentloaded",
    });
    await new Promise((resolve) => setTimeout(resolve, 10000));
    await page.evaluate((_) => window.stop());
  } catch (e) {}
  try {
    await Promise.race([
      page.waitForSelector("#wzrk-cancel"),
      page.waitForSelector("#truste-consent-button"),
    ]);
    await Promise.race([
      page.locator("#wzrk-cancel").click(),
      page.locator("#truste-consent-button").click(),
    ]);
  } catch (e) {}

  await page.waitForSelector("#myaccountBtn");
  await page.locator("#myaccountBtn").click();
  await page.locator("#myaccountBtn").click();
  await page.locator("#myaccountBtn").click();
  await page.waitForSelector("[id*='piano-id']", { visible: true });

  let frames = await page.frames();
  let loginFrame = frames.find((f) => f.url().indexOf("id.tinypass.com") > -1);

  await (await loginFrame.$("#email")).click();
  await (await loginFrame.$("#email")).type(email);
  await (await loginFrame.$("#autofill-form button[actionlogin]")).click();
  await loginFrame.waitForSelector("#pass-field-2");
  await (await loginFrame.$("#pass-field-2")).type(password);
  await (await loginFrame.$("#autofill-form button[actionlogin]")).click();
  await new Promise((resolve) => setTimeout(resolve, 3000));

  await Promise.race([
    page.waitForNetworkIdle(),
    new Promise((resolve) => setTimeout(resolve, 6000)),
  ]);
  await page.evaluate((_) => window.stop());
}

// Date Format - YYYY-MM-dd
async function getPublications(page, date) {
  const reponse = await page.evaluate(async (date) => {
    return fetch(
      `https://epaper.thehindu.com/ccidist-ws/th/?json=true&fromDate=${date}&toDate=${date}&skipSections=true&os=web&excludePublications=*-*`
    ).then((res) => res.json());
  }, date);

  const publications = reponse?.publications?.reduce((acc, p) => {
    acc[p.id] = {
      ...p,
      url: p.issues.web[0].url,
      pageUrl: join(p.issues.web[0].url, "OPS/cciobjects.json"),
    };
    return acc;
  }, {});
  return publications;
}

async function savePdf(page, publication, date, publication_id) {
  await page.goto(publication.pageUrl);
  const response = await page.evaluate(async () => {
    return JSON.parse(document.querySelector("body pre").innerText);
  });

  const images = [];
  for (const c of response.children) {
    const id = c.id;
    const url = `${publication.url}OPS/${encodeURIComponent(
      id + "+" + id
    )}_background-2048.png`;
    await page.goto(url, { timeout: 60000 });
    const image = await page.evaluate(async (url) => {
      const blob = await fetch(url).then((res) => res.blob());
      const result = await new Promise(async (resolve, reject) => {
        var reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsBinaryString(blob);
      });
      return result;
    }, url);
    images.push(image);
  }
  createPdf(images, date, publication_id);
  await page.close();
}

async function createPdf(images, date, publication_id) {
  const desktopDir = join(os.homedir(), "Desktop", "hindu");
  if (!fs.existsSync(desktopDir)) {
    fs.mkdirSync(desktopDir, { recursive: true });
  }
  const pdf = new pfdkit({
    autoFirstPage: false,
  });
  pdf.pipe(
    fs.createWriteStream(join(desktopDir, `${date}-${publication_id}.pdf`))
  );
  let index = 0;
  for (const img of images) {
    const imagepath = join(os.tmpdir(), `hindu-${index++}.png`);
    fs.writeFileSync(imagepath, Buffer.from(img, "binary"));
    console.log(imagepath);
    const openedImage = pdf.openImage(imagepath);
    pdf.addPage({ size: [openedImage.width, openedImage.height] });
    pdf.image(openedImage, 0, 0);
    fs.unlinkSync(imagepath);
  }
  pdf.end();
}

async function logOut(page) {
  await page.waitForSelector("#myaccountBtn");
  await page.locator("#myaccountBtn").click();
  await page.waitForSelector("xpath/.//div[contains(text(),'LOGOUT')]");
  await page.locator("xpath/.//div[contains(text(),'LOGOUT')]").click();

  await page.waitForNetworkIdle();
}

function getTodayDate() {
  const date = new Date();
  let year = new Intl.DateTimeFormat("en", { year: "numeric" }).format(date);
  let month = new Intl.DateTimeFormat("en", { month: "2-digit" }).format(date);
  let day = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(date);
  return `${year}-${month}-${day}`;
}

module.exports = {
  doLogin,
  getPublications,
  logOut,
  getTodayDate,
  savePdf,
};
