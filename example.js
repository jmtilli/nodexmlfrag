const nodexmlfrag = require('.');
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
    for (var idx of Object.keys(allCustomers)) {
        console.log('------');
        console.log(allCustomers[idx].customerId);
        console.log(allCustomers[idx].name);
        console.log(allCustomers[idx].accountCount);
        console.log(allCustomers[idx].totalBalance);
    }
}

example()
