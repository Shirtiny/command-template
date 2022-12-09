const minify = require('html-minifier').minify;
const fs = require('fs');

const compressHtml = (html) => {
  return minify(html, {
    removeComments: true,
    removeCommentsFromCDATA: true,
    removeCDATASectionsFromCDATA: true,
    collapseWhitespace: true,
    minifyCSS: true,
  });
}

const getNowFormatDate = () => {
  const date = new Date();
  const seperator1 = "-";
  const seperator2 = "_";
  const month = date.getMonth() + 1;
  const strDate = date.getDate();
  const currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
    + "-" + date.getHours() + seperator2 + date.getMinutes()
    + seperator2 + date.getSeconds();
  return currentdate;
}

const now = getNowFormatDate()//?

const html = fs.readFileSync('./postdrop.html', 'utf8');

const result = compressHtml(html);//?


// write result to file
fs.writeFileSync(`./postdrop.min.txt`, result, 'utf8');
