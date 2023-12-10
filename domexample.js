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
    for (var idx of Object.keys(allCustomers)) {
        console.log('------');
        console.log(allCustomers[idx].customerId);
        console.log(allCustomers[idx].name);
        console.log(allCustomers[idx].accountCount);
        console.log(allCustomers[idx].totalBalance);
    }
}

example()
