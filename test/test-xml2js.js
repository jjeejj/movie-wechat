'use strict';

var xml2js = require('xml2js');

var content = `<xml><ToUserName><![CDATA[gh_496233586c0a]]></ToUserName>
<FromUserName><![CDATA[o6lccuJ8kO8h0TWW2KY6ayxIVSqc]]></FromUserName>
<CreateTime>1472958218</CreateTime>
<MsgType><![CDATA[event]]></MsgType>
<Event><![CDATA[subscribe]]></Event>
<EventKey><![CDATA[]]></EventKey>
</xml>`;

xml2js.parseString(content,{trim: true,explicitArray:false },function (err, result) {
	console.log(Object.prototype.toString(result));
	console.log(result);
	console.log(result.CreateTime);
	
});


var obj = {name: "Super", Surname: "Man", age: 23};

var builder = new xml2js.Builder();

var xml = builder.buildObject(obj);

console.log(xml);