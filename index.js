const rp = require("request-promise");
const $ = require("cheerio");
const download = require("download-to-file");

function getDownloadLink(url) {
  return new Promise(async (resolve, reject) => {
    try {
      const html = await rp(url);
      resolve(
        Object.values($(".powerpress_link_d", html))
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
function downloadFile(url) {
  return new Promise(async (resolve, reject) => {
    try {
      const path = "./result/"+url.split("/").slice(-1)[0]
      download(url, path, function (err) {
        if (err) throw err;
        resolve(true);
      });
    } catch (e) {
      reject(e);
    }
  });
}
async function main() {
  let page = 1
  const BASE_URL = "https://www.xxx.com/page/";
  while(true){
    let dLink = await getDownloadLink(BASE_URL+(page++))
    if(dLink.length == 0)break
    dLink.forEach(element => {
      await downloadFile(
        element
      );
    });
  }
}

main();
