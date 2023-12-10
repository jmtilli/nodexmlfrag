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
    for (var idx of Object.keys(allCustomers)) {
        console.log('------');
        console.log(allCustomers[idx].customerId);
        console.log(allCustomers[idx].name);
        console.log(allCustomers[idx].accountCount);
        console.log(allCustomers[idx].totalBalance);
    }
}

example()
