const fs = require('fs')

fs.readFile('./source.txt', 'utf-8', (err, data) => {
  data = data.split("\n").filter(line => line.length > 0)
  let ret = data.map((line, idx) => {
    return {
      id: idx,
      hanzi: (/^([\u4e00-\u9fa5/]+)/.exec(line))[1].trim(),
      word: (/(.*?)\(/.exec(line))[1].trim(),
      pronunciation: (/\((.*?)\)/.exec(line))[1].trim(),
      translation: (/\)(.*)/.exec(line))[1].trim()
    }
  })
  console.log('result length equals to source? ', ret.length === data.length)
  fs.writeFile('./src/dict.js', `export default ${JSON.stringify(ret)}`, ()=> {})
})
