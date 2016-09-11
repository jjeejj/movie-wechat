'use strict';

var sha1 = require('sha1');

var crypto = require('crypto');

var hash = crypto.createHash('sha1');



var str = 'jjeejj';

var  sha1str = sha1(str)

hash.update(str,'utf8')

var hashstr = hash.digest('hex')

console.log('sha1: %s ',sha1str);

console.log('crypto %s',hashstr);

console.log(sha1str === hashstr); //true


var str1 = 'jje';

var str2 = 'ejj';

var hash1 = crypto.createHash('sha1');

hash1.update(str1,'utf8');
hash1.update(str2,'utf8');  //把之前的连个字符串拼接起来


console.log('-------------: %s ',hash1.digest('hex'));