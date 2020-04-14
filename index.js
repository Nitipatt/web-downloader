const rp = require("request-promise");
const request = require("request");
const $ = require("cheerio");
const download = require("download-to-file");
const prompt = require("prompt-sync")();

function getDownloadLink(url, query) {
  return new Promise(async (resolve, reject) => {
    try {
      const html = await rp(url);
      resolve(
        Object.values($(query, html))
          .map((item) => {
            try {
              return JSON.parse(JSON.stringify(item.attribs)).href;
            } catch (e) {
              return null;
            }
          })
          .filter((item) => item != null)
      );
    } catch (e) {
      reject(e);
    }
  });
}
function downloadFile(url,destination) {
  return new Promise(async (resolve, reject) => {
    try {
      const fileName = url.split("/").slice(-1)[0].split("?")[0];
      const path = destination + fileName;
      console.log(`Downloading ==> ${fileName}`);
      download(url, path, function (err) {
        if (err) reject(err);
        resolve(true);
      });
    } catch (e) {
      reject(e);
    }
  });
}
function getRedirectUrl(url) {
  return new Promise(async (resolve, reject) => {
    try {
      request(
        {
          url: url,
          followRedirect: true,
        },
        function (error, response, body) {
          const url =
            response && response.request && response.request.uri
              ? response.request.uri.href
              : null;
          resolve(url);
        }
      );
    } catch (e) {
      reject(e);
    }
  });
}

async function execute({
  url,
  page = undefined,
  query = undefined,
  destination = undefined,
} = {}) {
  while (true) {
    let dLink = await getDownloadLink(url.replace('$PAGE',(page ? page++ : "")), query);
    if (dLink.length == 0) break;
    dLink.forEach(async (element) => {
      try {
        const redirect = await getRedirectUrl(element);
        if (redirect) {
          await downloadFile(redirect, destination);
        }
      } catch (e) {}
    });
    if(!page)break
  }
}

(function () {
  let promptData = {};
  while (!promptData["url"]) {
    promptData["url"] = prompt(
      "Enter URL. If there're page plese include $PAGE (eg. www.xxx.com?page=$PAGE): "
    );
  }
  promptData["isPage"] = promptData["url"].includes("$PAGE");
  while (promptData["isPage"] && !promptData["page"]) {
    promptData["page"] = prompt("Enter starting page: ");
  }
  while (!promptData["query"]) {
    promptData["query"] = prompt("Enter query selector (eg. .class > a): ");
  }
  promptData["destination"] = prompt(
    "Enter result folder (default: ./result/): "
  );
  if(promptData["destination"])promptData["destination"] += (promptData["destination"].slice(-1)[0] != '/'?'/':'')
  else promptData["destination"] = './result/'
  execute(promptData);
})();
