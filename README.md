# NodeXMLFrag: a powerful combined tree-based and event-based parser for XML

Typically, XML is either parsed by a tree-based parser or by an event-based parser. Event-based parsers are fast and have a low memory footprint, but a drawback is that it is cumbersome to write the required event handlers. Tree-based parsers make the code easier to write, to understand and to maintain but have a large memory footprint as a drawback. Often, XML is used for huge files such as database dumps that necessitate event-based parsing, or so it would appear at a glance, because a tree-based parser cannot hold the whole parse tree in memory at the same time.

## Example application: customers in a major bank

Let us consider an example application: a listing of a customers in a major bank that has 30 million customers. The test file is in the following format:

```
<allCustomers>
  <customer id="1">
    <name>Clark Henson</name>
    <accountCount>1</accountCount>
    <totalBalance>5085.96</totalBalance>
  </customer>
  <customer id="2">
    <name>Elnora Ericson</name>
    <accountCount>3</accountCount>
    <totalBalance>3910.11</totalBalance>
  </customer>
  ...
</allCustomers>
```

The example format requires about 130 bytes per customer plus customer name length. If we assume an average customer name is 15 characters long, the required storage is about 145 bytes per customer. For 30 million customers, this is 4 gigabytes. In the example, the file is read to the following structure:

```
{
    'customerId': 1,
    'name': 'Clark Henson',
    'accountCount': 1,
    'totalBalance': 5085.96
}
```

## Parser with SAX

A SAX-based parser is implemented here:

```
const xml = require('sax-parser');
const fsp = require('fs/promises');
const buffer = require('buffer');

var allCustomers = {};

var parser = new xml.SaxParser(function(cb) {
    var charbufs = [];
    var customer = {};
    cb.onStartElementNS(function(elem, attrs, prefix, uri, namespaces) {
        charbufs = [];
        var attrsmap = {};
        for (var idx = 0; idx < attrs.length; idx++) {
            attrsmap[attrs[idx][0]] = attrs[idx][1];
        }
        if (elem == 'customer') {
            var cid = parseInt(attrsmap['id']);
            customer = {'customerId': cid};
            allCustomers[cid] = customer;
        }
    });
    cb.onEndElementNS(function(elem, attrs, prefix, uri, namespaces) {
        var chars = charbufs.join('');
        if (elem == "name") {
            customer.name = chars;
        }
        if (elem == "accountCount") {
            customer.accountCount = parseInt(chars);
        }
        if (elem == "totalBalance") {
            customer.totalBalance = parseFloat(chars);
        }
    });
    cb.onCharacters(function(chars) {
        charbufs.push(chars);
    });
    cb.onCdata(function(cdata) {
        charbufs.push(cdata);
    });
    cb.onError(function(msg) {
        throw new XmlError("Error in XML: " + msg);
    });
});

async function example() {
    const fd = await fsp.open('file.xml', 'r');
    const buf = buffer.Buffer.alloc(16384);
    while (true) {
        const readres = await fd.read(buf, 0, buf.length);
        var buf2 = buf;
        if (readres.bytesRead == 0) {
            break;
        }
        if (readres.bytesRead != buf.length) {
            buf2 = buf.slice(0, readres.bytesRead);
        }
        parser.parseString(buf2);
    }
    await fd.close();
}

example()
```

It can be seen that the parser is quite cumbersome and the code to construct a customer is scattered to two different places. Yet it is fast and has a low memory footprint.

## Parser with DOM

Here is a parser implemented with DOM:

```
const xmldom = require('@xmldom/xmldom');
const fsp = require('fs/promises');
const buffer = require('buffer');

var allCustomers = {};

async function example() {
    const fd = await fsp.open('file.xml', 'r');
    const contents = await fd.readFile('utf-8');
    await fd.close();
    const doc = new xmldom.DOMParser().parseFromString(contents, 'text/xml');
    const all = doc.getElementsByTagNameNS('*', 'allCustomers')[0];
    const all2 = all.getElementsByTagNameNS('*', 'customer');
    for (var idx = 0; idx < all2.length; idx++) {
        var cust = all2[idx];
        var cid = parseInt(cust.getAttribute('id'));
        allCustomers[cid] = 
            {
                'customerId': cid,
                'name': cust.getElementsByTagNameNS('*', 'name')[0].textContent,
                'accountCount': parseInt(cust.getElementsByTagNameNS('*', 'accountCount')[0].textContent),
                'totalBalance': parseFloat(cust.getElementsByTagNameNS('*', 'totalBalance')[0].textContent)
            };
    }
}

example()
```

The DOM-based parser is more satisfactory: it has the code to construct a customer object in only one place. Yet it is still a bit more complex than we would like to have and has some corner cases like ignoring the fact that there could be multiple elements with same tag or that the text contents could contain trailing letters after the number. Additionally, the memory consumption of the DOM parser is too high to read the whole 4 gigabyte test file on most computers.

## Parser with the new library

What if we could combine the benefits of the SAX-based approach with the benefits of the DOM-based approach? A parse tree fragment for a single <customer> element is small enough to be kept in memory. This is what the new library is about. Here is the code to parse the customer file with the new library:

```
const nodexmlfrag = require('nodexmlfrag');
const xml = require('sax-parser');
const fsp = require('fs/promises');
const buffer = require('buffer');

var allCustomers = {};

class ExampleFragmentHandler extends nodexmlfrag.FragmentSaxHandler {
    startXMLElement(elem, attrs) {
        if (this.is(["allCustomers", "customer"])) {
            this.startFragmentCollection();
        }
    }
    endXMLElement(elem, df) {
        if (this.is(["allCustomers", "customer"])) {
            var cid = df.getAttrIntNotNull('id');
            var customer = {
                'customerId': cid,
                'name': df.getStringNotNull("name"),
                'accountCount': df.getIntNotNull("accountCount"),
                'totalBalance': df.getFloatNotNull("totalBalance")
            };
            allCustomers[cid] = customer;
        }
    }
    xmlCharacters(chars) {
    }
}

var handler = new ExampleFragmentHandler();
var parser = new xml.SaxParser(handler.saxCb());

async function example() {
    const fd = await fsp.open('file.xml', 'r');
    const buf = buffer.Buffer.alloc(16384);
    while (true) {
        const readres = await fd.read(buf, 0, buf.length);
        var buf2 = buf;
        if (readres.bytesRead == 0) {
            break;
        }
        if (readres.bytesRead != buf.length) {
            buf2 = buf.slice(0, readres.bytesRead);
        }
        parser.parseString(buf2);
    }
    await fd.close();
}

example()
```

Note how the code is significantly more simple than for the SAX-based approach. Performance is close to the SAX-based approach, and memory consumption is essentially the same as for SAX.

## License

All of the material related to NodeXMLFrag is licensed under the following MIT license:

Copyright (C) 2023 Juha-Matti Tilli

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

