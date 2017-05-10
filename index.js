'use strict';

const Nightmare = require('nightmare');
const urlTool = require('url');
const fs = require('fs');
const nodemailer = require('nodemailer');
const low = require('lowdb');
const Promise = require('bluebird');

const db = low('db.json');

async function sendMail(urls, key){
  let transporter = nodemailer.createTransport({
    service: '163',
    auth: {
      user: 'khejing@163.com',
      pass: 'XXX'
    }
  });

  // setup email data with unicode symbols
  let mailOptions = {
    from: '"House Renting Robot" <khejing@163.com>', // sender address
    to: 'xxx@163.com', // list of receivers
    subject: `${key}有新房子了，快看看！`, // Subject line
    text: urls.join('\n'), // plain text body
  };

  // send mail with defined transport object
  const info = await transporter.sendMail(mailOptions);
  console.log('Email %s sent: %s', info.messageId, info.response);
}

async function crawlOneSearchUrl(url, key){
  const oldHouseUrls = db.get('houses').value() || [];
  const nightmare = Nightmare({
    show: true
  });
  try{
    await nightmare.goto(url);
    const houseRawUrls = await nightmare.evaluate(() => Array.from(document.querySelectorAll('.listUl li h2')).map(e => e.querySelector('a')).map(e => e.getAttribute('href')));
    const houseUrls = houseRawUrls
      .filter(e => !e.startsWith('http://short.58.com/'))
      .map(e => {
        const urlObj = urlTool.parse(e);
        return urlObj.protocol + '//' + urlObj.host + urlObj.pathname;
      });
    const newHouseUrls = houseUrls.filter(e => !oldHouseUrls.find(e1 => e1 === e));
    console.log('new houses', newHouseUrls.length);
    if(newHouseUrls.length){
      await sendMail(newHouseUrls, key);
      db.set('houses', oldHouseUrls.concat(newHouseUrls)).write();
    }
  }catch(e){
    console.error(e);
  }
  await nightmare.end();
  await Promise.delay(5 * 1000);
}

async function crawl(){
  await crawlOneSearchUrl('http://bj.58.com/zufang/sub/l572986/s572985_573111_1101623_573170_1101624/0/?minprice=4000_6500&pagetype=ditie&PGTID=0d300008-0000-1a80-e506-4fb04a9f4737&ClickID=4', '15号线');
  await crawlOneSearchUrl('http://bj.58.com/zufang/sub/l677835/s1101618_1101619_1101620_573111/0/?minprice=4000_6500&PGTID=0d300008-0000-182d-4bc4-a292a7698e05&ClickID=4', '14号线');
  await crawlOneSearchUrl('http://bj.58.com/anhuili/zufang/0/?minprice=4000_6500&pagetype=area&PGTID=0d300008-004b-463b-50fa-b3a8b843a16b&ClickID=4', '安慧里');
  await crawlOneSearchUrl('http://bj.58.com/datun/zufang/0/?minprice=4000_6500&pagetype=area&PGTID=0d300008-0176-8427-a346-c1b8b279abd1&ClickID=3', '大屯');
  await crawlOneSearchUrl('http://bj.58.com/huajiadi/zufang/0/?minprice=4000_6500&pagetype=area&PGTID=0d300008-0176-98a1-7c65-a998556d6c03&ClickID=4', '花家地');
  await crawlOneSearchUrl('http://bj.58.com/huixl/zufang/0/?minprice=4000_6500&pagetype=area&PGTID=0d300008-0178-3257-a9bc-2254ee74ef7e&ClickID=4', '惠新里');
  await crawlOneSearchUrl('http://bj.58.com/wangjing/zufang/0/?minprice=4000_6500&pagetype=area&PGTID=0d300008-038f-0daf-8c28-fbc8760b8727&ClickID=3', '望京');
  await crawlOneSearchUrl('http://bj.58.com/yayuncun/zufang/0/?minprice=4000_6500&pagetype=area&PGTID=0d300008-004b-3873-78e6-95fcb5bfb12e&ClickID=4', '亚运村');
  await crawlOneSearchUrl('http://bj.58.com/xiaoying/zufang/0/?minprice=4000_6500&pagetype=area&PGTID=0d300008-004a-9b6a-d917-7004a7d02e00&ClickID=4', '小营');
  setTimeout(crawl, 10 * 60 * 1000);
}

(async () => {
  crawl();
})();
