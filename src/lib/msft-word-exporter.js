const htmlDocx= require('html-docx-js/dist/html-docx')

function exportWordDocument (documentToExport) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  html, body, h1, h2, h3, p, li, blockquote {
    font-family: 'Avenir Next', Avenir, sans-serif;
  }
  h1, h2, h3 {
    font-weight: 400;
  }
  p, li, blockquote {
    font-size: 14px;
    font-weight: 300;
  }
</style>
</head>
<body>
<h1>${documentToExport.title}</h1>
${documentToExport.body}
</body>
</html>`

  const docx = htmlDocx.asBlob(html)
  const filename = documentToExport.title + '.docx'

  // https://stackoverflow.com/questions/45831191/generate-and-download-file-from-js
  const evt = document.createEvent('MouseEvents')
  const link = document.createElement('a')
  link.download = filename
  link.href = window.URL.createObjectURL(docx)
  link.dataset.downloadurl = ['text/plain', link.download, link.href].join(':')
  evt.initEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
  link.dispatchEvent(evt)
}

export default { exportWordDocument }
