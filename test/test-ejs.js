
var ejs = require('ejs');

// ejs.open = '{{';
// ejs.close = '}}';

var heredoc = require('heredoc');

var str = heredoc(function () {/*
	within this comment block,
    any text
    will
      be
        treated
          as
      pre-formatted
        multiline text
    (kinda like html <pre>)	
    <body>
	  <p>indented strings are fine <%= user.name %></p>
	  <p>the preceding spaces will be shrinked <%= user.password%></p>
	</body>
	<%= str1 %>
	<%- str1 %>
*/});

var str1 = ` <body>
				  <p>indented strings are fine <%= name %></p>
				  <p>the preceding spaces will be shrinked <%= password %></p>
			</body>`

// console.log(str);
var user = {
		name:'jjeejj',
		password:'wenjun'
	}
var ejsStr = ejs.compile(str1);
console.log(ejsStr(user));


var strRender = ejs.render(str,{
	user:{
		name:'jjeejj',
		password:'wenjun'
	},
	// filename:'reply',
	str1:str1
})

// console.log(strRender);

// var template = '{{= message }}';
// var context = {message: 'Hello template!',open:'{{',close:'}}'};

// console.log(ejs.render(template, context));

// var template1 = '<%=: movies | last %>';
// var context1 = {movies: [
//     'Bambi',
//     'Babe: Pig in the City',
//     'Enter the Void'
// ]};

// console.log(ejs.render(template1, context1));

