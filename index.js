class XmlError extends Error {
}
class XmlTagMissingError extends XmlError {
}
class XmlValueMissingError extends XmlError {
}
class XmlMultipleChildrenError extends XmlError {
}
class XmlValueError extends XmlError {
}

class XmlStack {
    constructor() {
        this.elements = [];
    }
    push(elem) {
        this.elements.push(elem);
    }
    pop(elem) {
        const got = this.elements.pop();
        if (got != elem) {
            throw new Error("XmlStack.pop: want " + elem + ", got " + got);
        }
    }
    is(names) {
        if (names.length != this.elements.length) {
            return false;
        }
        for (var i = 0; i < names.length; i++) {
            if (names[i] != this.elements[i]) {
                return false;
            }
        }
        return true;
    }
}

function isInteger(x) {
    if (isNaN(x)) {
        return false;
    }
    if (!isFinite(x)) {
        return false;
    }
    if (x % 1 != 0) {
        return false;
    }
    if ((x-1) == x && (x+1) == x) {
        return false;
    }
    return true;
}

class DocumentFragment {
    constructor(tag, attrs, text) {
        if (tag == null) {
            if (text == null) {
                throw new Error("text children must have text");
            }
            this.text = text;
            this.children = [];
            this.tag = null;
            this.attrs = null;
            if (attrs != null) {
                throw new Error("text children do not have attrs");
            }
        } else {
            this.children = [];
            this.tag = tag;
            this.attrs = attrs;
            this.text = null;
        }
    }
    isText() {
        return this.text != null;
    }
    assertTag(tag) {
        if (this.tag != tag) {
            throw new Error("expect tag " + tag + " have " + this.tag);
        }
    }
    get(tag) {
        var f = null;
        if (this.tag == null) {
            throw new Error("get on text child");
        }
        if (tag == null) {
            throw new Error("no tag name");
        }
        for (var i = 0; i < this.children.length; i++) {
            if (this.children[i].tag != tag) {
                continue;
            }
            if (f != null) {
                throw new XmlMultipleChildrenError("multiple children");
            }
            f = this.children[i];
        }
        return f;
    }
    getText() {
        return this.text;
    }
    getNotNull(tag) {
        var f = this.get(tag);
        if (f == null) {
            throw new XmlTagMissingError("no such tag: " + tag);
        }
        return f;
    }
    addTextChild(text) {
        if (this.tag == null) {
            throw new Error("trying to add child to text");
        }
        this.children.push(new DocumentFragment(null, null, text));
    }
    getString(elem, defaultValue) {
        var result = this.getStringObject(elem);
        if (result == null) {
            return defaultvalue;
        }
        return result;
    }
    getStringNotNull(elem) {
        var result = this.getStringObject(elem);
        if (result == null) {
            throw new XmlValueMissingError("XML value missing");
        }
        return result;
    }
    getStringObject(elem) {
        var result = "";
        var e = this.get(elem);
        if (e == null) {
            return null;
        }
        return e.getThisStringObjectEmptyIsEmpty();
    }
    getAttrStringObject(attr) {
        return this.attrs[attr];
    }
    getAttrStringNotNull(attr) {
        var result = this.getAttrStringObject(attr);
        if (result == null) {
            throw new XmlValueMissingError("XML value missing");
        }
        return result;
    }
    getAttrString(attr, defaultValue) {
        var result = this.getAttrStringObject(attr);
        if (result == null) {
            return defaultValue;
        }
        return result;
    }
    getThisString(defaultValue) {
        var result = this.getThisStringObjectEmptyIsNull();
        if (result == null) {
            return defaultValue;
        }
        return result;
    }
    getThisStringNotEmpty() {
        var result = this.getThisStringObjectEmptyIsNull();
        if (result == null) {
            throw new XmlValueMissingError("XML value missing");
        }
        return result;
    }
    getThisStringObjectEmptyIsNull() {
        var result = this.getThisStringObjectEmptyIsEmpty();
        if (result == "") {
            return null;
        }
        return result;
    }
    getThisStringObjectEmptyIsEmpty() {
        var results = [];
        if (this.tag == null) {
            throw new Error("get on text child");
        }
        for (var i = 0; i < this.children.length; i++) {
            if (this.children[i].tag != null) {
                throw new Error("element has a non-text child");
            }
            results.push(this.children[i].getText());
        }
        return results.join('');
    }
    getThisFloatNotNull() {
        var s = null;
        s = this.getThisStringNotEmpty();
        var num = Number(s);
        if (isNaN(num)) {
            throw new XmlValueError("String " + s + " not a float");
        }
        return num;
    }
    getThisFloatObject() {
        var s = null;
        try {
            s = this.getThisStringNotEmpty();
        }
        catch (err) {
            return null;
        }
        var num = Number(s);
        if (isNaN(num)) {
            throw new XmlValueError("String " + s + " not a float");
        }
        return num;
    }
    getThisFloat(defaultValue) {
        var s = null;
        try {
            s = this.getThisStringNotEmpty();
        }
        catch (err) {
            return defaultValue;
        }
        var num = Number(s);
        if (isNaN(num)) {
            throw new XmlValueError("String " + s + " not a float");
        }
        return num;
    }
    getThisIntNotNull() {
        var s = null;
        s = this.getThisStringNotEmpty();
        var num = Number(s);
        if (!isInteger(num)) {
            throw new XmlValueError("String " + s + " not an integer");
        }
        return num;
    }
    getThisIntObject() {
        var s = null;
        try {
            s = this.getThisStringNotEmpty();
        }
        catch (err) {
            return null;
        }
        var num = Number(s);
        if (!isInteger(num)) {
            throw new XmlValueError("String " + s + " not an integer");
        }
        return num;
    }
    getThisInt(defaultValue) {
        var s = null;
        try {
            s = this.getThisStringNotEmpty();
        }
        catch (err) {
            return defaultValue;
        }
        var num = Number(s);
        if (!isInteger(num)) {
            throw new XmlValueError("String " + s + " not an integer");
        }
        return num;
    }
    getFloatNotNull(elem) {
        var s = null;
        s = this.getStringNotNull(elem);
        var num = Number(s);
        if (isNaN(num)) {
            throw new XmlValueError("String " + s + " not a float");
        }
        return num;
    }
    getFloatObject(elem) {
        var s = null;
        try {
            s = this.getStringNotNull(elem);
        }
        catch (err) {
            return null;
        }
        var num = Number(s);
        if (isNaN(num)) {
            throw new XmlValueError("String " + s + " not a float");
        }
        return num;
    }
    getFloat(elem, defaultValue) {
        var s = null;
        try {
            s = this.getStringNotNull(elem);
        }
        catch (err) {
            return defaultValue;
        }
        var num = Number(s);
        if (isNaN(num)) {
            throw new XmlValueError("String " + s + " not a float");
        }
        return num;
    }
    getIntNotNull(elem) {
        var s = null;
        s = this.getStringNotNull(elem);
        var num = Number(s);
        if (!isInteger(num)) {
            throw new XmlValueError("String " + s + " not an integer");
        }
        return num;
    }
    getIntObject(elem) {
        var s = null;
        try {
            s = this.getStringNotNull(elem);
        }
        catch (err) {
            return null;
        }
        var num = Number(s);
        if (!isInteger(num)) {
            throw new XmlValueError("String " + s + " not an integer");
        }
        return num;
    }
    getInt(elem, defaultValue) {
        var s = null;
        try {
            s = this.getStringNotNull(elem);
        }
        catch (err) {
            return defaultValue;
        }
        var num = Number(s);
        if (!isInteger(num)) {
            throw new XmlValueError("String " + s + " not an integer");
        }
        return num;
    }
    add(child) {
        if (this.tag == null) {
            throw new Error("trying to add child to text");
        }
        this.children.push(child);
    }
    getAttrFloatNotNull(attr) {
        var s = null;
        s = this.getAttrStringNotNull(attr);
        var num = Number(s);
        if (isNaN(num)) {
            throw new XmlValueError("String " + s + " not a float");
        }
        return num;
    }
    getAttrFloatObject(attr) {
        var s = null;
        try {
            s = this.getAttrStringNotNull(attr);
        }
        catch (err) {
            return null;
        }
        var num = Number(s);
        if (isNaN(num)) {
            throw new XmlValueError("String " + s + " not a float");
        }
        return num;
    }
    getAttrFloat(attr, defaultValue) {
        var s = null;
        try {
            s = this.getAttrStringNotNull(attr);
        }
        catch (err) {
            return defaultValue;
        }
        var num = Number(s);
        if (isNaN(num)) {
            throw new XmlValueError("String " + s + " not a float");
        }
        return num;
    }
    getAttrIntNotNull(attr) {
        var s = null;
        s = this.getAttrStringNotNull(attr);
        var num = Number(s);
        if (!isInteger(num)) {
            throw new XmlValueError("String " + s + " not an integer");
        }
        return num;
    }
    getAttrIntObject(attr) {
        var s = null;
        try {
            s = this.getAttrStringNotNull(attr);
        }
        catch (err) {
            return null;
        }
        var num = Number(s);
        if (!isInteger(num)) {
            throw new XmlValueError("String " + s + " not an integer");
        }
        return num;
    }
    getAttrInt(attr, defaultValue) {
        var s = null;
        try {
            s = this.getAttrStringNotNull(attr);
        }
        catch (err) {
            return defaultValue;
        }
        var num = Number(s);
        if (!isInteger(num)) {
            throw new XmlValueError("String " + s + " not an integer");
        }
        return num;
    }
}

class ConvertContentHandler {
    constructor() {
        this.fragment = null;
        this.frags = [];
        this.strfrags = [];
    }
    ready() {
        return this.fragment != null && this.frags.length == 0;
    }
    startElement(name, attrs2) {
        const attrs = {};
        for (var i = 0; i < attrs2.length; i++) {
            attrs[attrs2[i][0]] = attrs2[i][1];
        }
        const elem = new DocumentFragment(name, attrs);
        if (this.fragment == null) {
            this.fragment = elem;
        }
        if (this.frags.length > 0) {
            var str = this.strfrags.join('');
            if (str.length > 0) {
                this.frags[this.frags.length-1].addTextChild(str);
            }
            this.frags[this.frags.length-1].add(elem);
        }
        this.strfrags = [];
        this.frags.push(elem);
    }
    endElement(name) {
        var str = this.strfrags.join('');
        if (str.length > 0) {
            this.frags[this.frags.length-1].addTextChild(str);
        }
        this.strfrags = [];
        this.frags.pop();
    }
    characters(content) {
        this.strfrags.push(content);
    }
}

class FragmentSaxHandler {
    constructor() {
        this.stack = new XmlStack();
        this.h = null;
        this.startXMLElementCallActive = false;
    }
    is(names) {
        return this.stack.is(names);
    }
    startFragmentCollection() {
        if (!this.startXMLElementCallActive) {
            throw new Error("can be called only within startXMLElement");
        }
        if (this.h != null) {
            throw new Error("fragment collection already started");
        }
        this.h = new ConvertContentHandler();
    }
    xmlCharacters(chars) {
    }
    saxCb() {
        const thisObj = this;
        return function(cb) {
            cb.onStartDocument(function() {});
            cb.onEndDocument(function() {});
            cb.onStartElementNS(function(elem, attrs, prefix, uri, namespaces) {
                thisObj.stack.push(elem);
                if (thisObj.h == null) {
                    thisObj.startXMLElementCallActive = true;
                    try {
                        thisObj.startXMLElement(elem, attrs);
                    }
                    finally {
                        thisObj.startXMLElementCallActive = false;
                    }
                }
                // Note: h may have changed here
                if (thisObj.h != null) {
                    thisObj.h.startElement(elem, attrs);
                }
            });
            cb.onEndElementNS(function(elem, attrs, prefix, uri, namespaces) {
                var df = null;
                if (thisObj.h != null) {
                    thisObj.h.endElement(elem);
                    if (thisObj.h.ready()) {
                        df = thisObj.h.fragment;
                        thisObj.h = null;
                    }
                }
                // Note: h may have changed here
                if (thisObj.h == null) {
                    thisObj.endXMLElement(elem, df)
                }
                thisObj.stack.pop(elem);
            });
            cb.onCharacters(function(chars) {
                if (thisObj.h != null) {
                    thisObj.h.characters(chars);
                } else {
                    thisObj.xmlCharacters(chars);
                }
            });
            cb.onCdata(function(cdata) {
                if (thisObj.h != null) {
                    thisObj.h.characters(chars);
                } else {
                    thisObj.xmlCharacters(chars);
                }
            });
            cb.onComment(function(msg) {
                // ignore
            });
            cb.onWarning(function(msg) {
                // ignore
            });
            cb.onError(function(msg) {
                throw new XmlError("Error in XML: " + msg);
            });
        }
    }
}
exports.FragmentSaxHandler = FragmentSaxHandler;
exports.DocumentFragment = DocumentFragment;
exports.XmlError = XmlError;
exports.XmlTagMissingError = XmlTagMissingError;
exports.XmlValueMissingError = XmlValueMissingError;
exports.XmlMultipleChildrenError = XmlMultipleChildrenError;
exports.XmlValueError = XmlValueError;
