module.exports = function (RED) {
    "use strict";
    const marked = require("marked");
    marked.setOptions({
        renderer: new marked.Renderer(),
        highlight: function(code, language) {
          const hljs = require('highlight.js');
          const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
          return hljs.highlight(validLanguage, code).value;
        },
        pedantic: false,
        gfm: true,
        breaks: true,
        sanitize: false,
        smartLists: true,
        smartypants: false,
        xhtml: true
      });
     
      const createDOMPurify = require('dompurify');
      const { JSDOM } = require('jsdom');
      
      const window = new JSDOM('').window;
      const DOMPurify = createDOMPurify(window);
      
     
      
    function MDtoHTMLNode(n) {
        RED.nodes.createNode(this, n);
        this.name = n.name;
        this.infield = n.infield;
        this.outfield = n.outfield;
        this.infieldType = n.infieldType;
        this.outfieldType = n.outfieldType;

        var node = this;

        function output(msg, value, send, done) {
            if (node.outfieldType === 'msg') {
                RED.util.setMessageProperty(msg, node.outfield, value);
                send(msg);
                done();
            } else if ((node.outfieldType === 'flow') ||
                (node.outfieldType === 'global')) {
                var context = RED.util.parseContextStore(node.outfield);
                var target = node.context()[node.outfieldType];
                target.set(context.key, value, context.store, function (err) {
                    if (err) {
                        done(err);
                    } else {
                        send(msg);
                        done();
                    }
                });
            }
        }
      
        node.on("input", function (msg, send, done) {
            try {
              let value =""
                if (node.infieldType === 'msg') {
                  value =  RED.util.getMessageProperty(msg, node.infield)||"";
                  
                  output(msg, DOMPurify.sanitize(marked(value)), send, done);
                } else if ((node.infieldType === 'flow') ||
                    (node.infieldType === 'global')) {
                   RED.util.evaluateNodeProperty(node.infield, node.infieldType , node, msg, (err,value) => {
                        if (err) {
                            done(err);
                        } else {
                            output(msg, DOMPurify.sanitize(marked(value)), send, done);
                        }
                    });
                    
                }
         
            } catch (err) {
                done(err.message);
            }

           
        });
    }

    RED.nodes.registerType("mdtohtml", MDtoHTMLNode);

}