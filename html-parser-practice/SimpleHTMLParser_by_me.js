var SimpleHTMLParser = function() {}

SimpleHTMLParser.prototype = {
	startTag: /^<([a-zA-Z_][\w\-\.]*)(\s*([a-zA-Z_][\w\-\.]*)(?:\s*=\s*(?:("[^"]*")+|('[^']*')+|[^\s"'<>\/=]+]))?)*(\s*(\/?)>)/,
	endTag: /^<\/([a-zA-Z_][\w\-\.]*)[^>]*>/,
	handler: {
		dealComment: function(comment) {console.log('COMMENT: ' + comment)},
		dealStartTag: function(tagName) {
			console.log('STARTTAG: ' + tagName);
		},
		dealEndTag: function(tagName) {
			console.log('ENDTAG: ' + tagName);
		},
		dealText: function(text) {
			console.log('PLAIN TEXT: ' + text);
		}
	},
	parse: function(html) {
		while(html.length > 0) {
			if (html.startsWith('<!--')) {
				var index = html.indexOf('-->');
				if (index < 0) {
					html = '';
				} else {
					this.handler.dealComment(html.substring(4, index));
					html = html.substring(index + 3);
				}
				continue;
			}

			if (this.startTag.test(html)) {
				var sm = html.match(this.startTag);
				this.handler.dealStartTag(sm[1]);
				html = html.substring(sm[0].length);
				continue;
			}

			if (this.endTag.test(html)) {
				var em = html.match(this.endTag);
				this.handler.dealEndTag(em[1]);
				html = html.substring(em[0].length);
				continue;
			}
			var nextStart = html.indexOf('<');
			if (nextStart < 0) {
				this.handler.dealText(html);
				html = '';
			} else {
				this.handler.dealText(html.substring(0, nextStart));
				html = html.substring(nextStart);
				continue;
			}
		}
	}
}


var test = new SimpleHTMLParser()
var testText = "<html><body><p>this is a test text.</p></body></html>";

test.parse(testText);