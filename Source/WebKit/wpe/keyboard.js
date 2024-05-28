class WPEKeyboard {
    constructor(keys) {
        this.mode = "alphameric";
        this.capsLocked = false;

        this.enterKeyElements = [];

        // Keyboard element
        this.keyboardElement = this.createKeyboardElement();
        document.body.appendChild(this.keyboardElement);

        // Alphameric layout element
        this.alphamericLayoutElement = this.createKeyLayoutElement();
        this.keyboardElement.appendChild(this.alphamericLayoutElement);

        for (const keyRow of keys.alphameric) {
            const keyRowElement = this.createKeyRowElement();
            this.alphamericLayoutElement.appendChild(keyRowElement);

            for (const key of keyRow) {
                const keyElement = this.createKeyElement(key);
                keyRowElement.appendChild(keyElement);

                if (key.isEnter)
                    this.enterKeyElements.push(keyElement);
            }
        }

        // Punctuation layout element
        this.punctuationLayoutElement = this.createKeyLayoutElement();
        this.punctuationLayoutElement.style.display = "none";
        this.keyboardElement.appendChild(this.punctuationLayoutElement);

        for (const keyRow of keys.punctuation) {
            const keyRowElement = this.createKeyRowElement();
            this.punctuationLayoutElement.appendChild(keyRowElement);

            for (const key of keyRow) {
                const keyElement = this.createKeyElement(key);
                keyRowElement.appendChild(keyElement);

                if (key.isEnter)
                    this.enterKeyElements.push(keyElement);
            }
        }
    }

    createKeyboardElement() {
        const element = document.createElement("div");
        element.id = "wpe-keyboard";

        element.style.position = "fixed";
        element.style.left = "0";
        element.style.right = "0";
        element.style.bottom = "0";
        element.style.margin = "0";
        element.style.zIndex = "9007199254740991";
        element.style.display = "none";
    
        element.addEventListener("mousedown", event => event.preventDefault());
        element.addEventListener("touchmove", event => event.preventDefault());

        return element;
    }

    createKeyLayoutElement() {
        const element = document.createElement("div");
        element.classList.add("key-layout");
        return element;
    }

    createKeyRowElement() {
        const element = document.createElement("div");
        element.classList.add("key-row");
        return element;
    }

    createKeyElement(key) {
        const element = document.createElement("button");
        element.classList.add("key");

        element.addEventListener("touchstart", this.onKeyDown.bind(this));
        element.addEventListener("touchend", this.onKeyUp.bind(this));

        element.key = key;

        if (key.text) {
            const textElement = this.createTextElement(key.text);
            element.appendChild(textElement);
        }

        if (key.capText) {
            const textElement = this.createTextElement(key.capText, "cap");
            element.appendChild(textElement);
        }

        if (key.altText) {
            const altTextElement = this.createTextElement(key.altText, "alt");
            element.appendChild(altTextElement);
        }

        if (key.altCapText) {
            const altCapTextElement = this.createTextElement(key.altCapText, "alt", "cap");
            element.appendChild(altCapTextElement);
        }

        if (key.icon) {
            const iconElement = this.createIconElement(key.icon);
            element.appendChild(iconElement);
        }

        if (key.isDone)
            element.id = "done";
        else if (key.isCapsLock)
            element.id = "capslock";
        else if (key.isMode)
            element.id = "mode";
        else if (key.isBackspace)
            element.id = "backspace";
        else if (key.isEnter)
            element.id = "enter";
        else if (key.isSpaceBar)
            element.id = "spacebar";

        if (key.isDisabled)
            element.classList.add("disabled");

        return element;
    }

    createTextElement(text, ...additionalClasses) {
        const element = document.createElement("span");
        element.classList.add("text");
        if (additionalClasses)
            element.classList.add(...additionalClasses);
        element.style.pointerEvents = "none";
        element.textContent = text;
        return element;
    }

    createIconElement(icon) {
        var svgDocument = new DOMParser().parseFromString(icon, "image/svg+xml");
        var element = document.importNode(svgDocument.documentElement, true);
        element.classList.add("icon");
        element.style.pointerEvents = "none";
        return element;
    }

    onKeyDown(event) {
        event.preventDefault();

        const keyElement = event.target;
        const key = keyElement.key;

        if (key.isDisabled)
            return;

        keyElement.pressed = true;
        keyElement.classList.add("pressed");

        const altText = this.capsLocked ? key.altCapText : key.altText;
        if (key.isBackspace || altText) {
            this.longPressTimeout = setTimeout(() => {
                if (key.isBackspace) {
                    this.backspceInterval = setInterval(this.deleteText, 200);
                } else {
                    this.insertText(altText);
                    keyElement.pressed = false;
                }
            }, 1000);
        }
    }

    onKeyUp(event) {
        event.preventDefault();

        const keyElement = event.target;
        const key = keyElement.key;

        if (key.isDisabled)
            return;

        if (keyElement.pressed) {
            if (key.isDone)
                this.done();
            else if (key.isCapsLock)
                this.setCapsLocked(!this.capsLocked);
            else if (key.isMode)
                this.setMode(this.mode === "alphameric" ? "punctuation" : "alphameric");
            else if (key.isBackspace)
                this.deleteText();
            else if (key.isEnter) {
                if (document.activeElement.nodeName === "TEXTAREA")
                    this.insertText("\n");
            } else if (key.isSpaceBar)
                this.insertText(" ");
            else 
                this.insertText(this.capsLocked ? key.capText : key.text);
        }

        keyElement.pressed = false;
        keyElement.classList.remove("pressed");

        clearTimeout(this.longPressTimeout);
        clearInterval(this.backspceInterval);
    }

    done() {
        document.activeElement.blur();
    }

    setCapsLocked(capsLocked) {
        if (capsLocked)
            this.keyboardElement.classList.add("cap");
        else
            this.keyboardElement.classList.remove("cap");
        this.capsLocked = capsLocked;
    }

    setMode(mode) {
        if (mode === "alphameric") {
            this.alphamericLayoutElement.style.display = "block";
            this.punctuationLayoutElement.style.display = "none";
        } else {
            this.alphamericLayoutElement.style.display = "none";
            this.punctuationLayoutElement.style.display = "block";
        }
        this.mode = mode;
    }

    insertText(text) {
        document.execCommand("insertText", false, text);
    }

    deleteText() {
        document.execCommand("delete");
    }

    updateEnterKeyElementsStyle() {
        for (const element of this.enterKeyElements) {
            if (document.activeElement.nodeName === "TEXTAREA")
                element.classList.remove("disabled");
            else
                element.classList.add("disabled");
        }
    }

    show() {
        this.setMode("alphameric");
        this.setCapsLocked(false);

        this.updateEnterKeyElementsStyle();

        this.keyboardElement.style.display = "block";

        this.originalBodyPaddingBottom = document.body.style.paddingBottom;
        document.body.style.paddingBottom = this.keyboardElement.offsetHeight + "px";
    
        document.activeElement.scrollIntoView({ "block": "center" });
    }

    hide() {
        this.keyboardElement.style.display = "none";

        document.body.style.paddingBottom = this.originalBodyPaddingBottom;
    }
}

const icons = {
    "backspace": `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
            <path d="M544 128c0-17.7-14.3-32-32-32H205.3c-8.5 0-16.6 3.4-22.6 9.4L32 256 182.6 406.6c6 6 14.1 9.4 22.6 9.4H512c17.7 0 32-14.3 32-32V128zM512 64c35.3 0 64 28.7 64 64V384c0 35.3-28.7 64-64 64H205.3c-17 0-33.3-6.7-45.3-18.7L9.4 278.6c-6-6-9.4-14.1-9.4-22.6s3.4-16.6 9.4-22.6L160 82.7c12-12 28.3-18.7 45.3-18.7H512zM427.3 180.7c6.2 6.2 6.2 16.4 0 22.6L374.6 256l52.7 52.7c6.2 6.2 6.2 16.4 0 22.6s-16.4 6.2-22.6 0L352 278.6l-52.7 52.7c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6L329.4 256l-52.7-52.7c-6.2-6.2-6.2-16.4 0-22.6s16.4-6.2 22.6 0L352 233.4l52.7-52.7c6.2-6.2 16.4-6.2 22.6 0z"/>
        </svg>`,
    "capslock": `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
            <path d="M169.4 41.4c12.5-12.5 32.8-12.5 45.3 0l160 160c9.2 9.2 11.9 22.9 6.9 34.9s-16.6 19.8-29.6 19.8H256V440c0 22.1-17.9 40-40 40H168c-22.1 0-40-17.9-40-40V256H32c-12.9 0-24.6-7.8-29.6-19.8s-2.2-25.7 6.9-34.9l160-160z"/>
        </svg>`,
    "enter": `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path d="M480 48c0-8.8 7.2-16 16-16s16 7.2 16 16V224c0 44.2-35.8 80-80 80H54.6L155.3 404.7c6.2 6.2 6.2 16.4 0 22.6s-16.4 6.2-22.6 0l-128-128c-6.2-6.2-6.2-16.4 0-22.6l128-128c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6L54.6 272H432c26.5 0 48-21.5 48-48V48z"/>
        </svg>`,
    "done": `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path d="M267.3 395.3c-6.2 6.2-16.4 6.2-22.6 0l-192-192c-6.2-6.2-6.2-16.4 0-22.6s16.4-6.2 22.6 0L256 361.4 436.7 180.7c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6l-192 192z"/>
        </svg>
    `
}

const keys = {
    "alphameric": [
        [
            { text: "q", capText: "Q", altText: "1", altCapText: "1" },
            { text: "w", capText: "W", altText: "2", altCapText: "2" },
            { text: "e", capText: "E", altText: "3", altCapText: "3" },
            { text: "r", capText: "R", altText: "4", altCapText: "4" },
            { text: "t", capText: "T", altText: "5", altCapText: "5" },
            { text: "z", capText: "Z", altText: "6", altCapText: "6" },
            { text: "u", capText: "U", altText: "7", altCapText: "7" },
            { text: "i", capText: "I", altText: "8", altCapText: "8" },
            { text: "o", capText: "O", altText: "9", altCapText: "9" },
            { text: "p", capText: "P", altText: "0", altCapText: "0" },
            { text: "ü", capText: "Ü" },
            { isBackspace: true, icon: icons.backspace }
        ], [
            { text: "a", capText: "A" },
            { text: "s", capText: "S", altText: "ß" },
            { text: "d", capText: "D" },
            { text: "f", capText: "F" },
            { text: "g", capText: "G" },
            { text: "h", capText: "H" },
            { text: "j", capText: "J" },
            { text: "k", capText: "K" },
            { text: "l", capText: "L" },
            { text: "ö", capText: "Ö" },
            { text: "ä", capText: "Ä" },
            { isEnter: true, icon: icons.enter }
        ], [
            { isCapsLock: true, icon: icons.capslock },
            { text: "y", capText: "Y" },
            { text: "x", capText: "X" },
            { text: "c", capText: "C" },
            { text: "v", capText: "V" },
            { text: "b", capText: "B" },
            { text: "n", capText: "N" },
            { text: "m", capText: "M" },
            { text: ",", capText: ";" },
            { text: ".", capText: ":" },
            { text: "-", capText: "_" },
            { text: "?", capText: "ß" },
            { text: "!", capText: "§" }
        ], [
            { text: "1#?", capText: "1#?", isMode: true },
            { isSpaceBar: true },
            { isDone: true, icon: icons.done }
        ]
    ],
    "punctuation": [
        [
            { text: "1", capText: "1" },
            { text: "2", capText: "2" },
            { text: "3", capText: "3" },
            { text: "4", capText: "4" },
            { text: "5", capText: "5" },
            { text: "6", capText: "6" },
            { text: "7", capText: "7", altText: "{", altCapText: "{" },
            { text: "8", capText: "8", altText: "[", altCapText: "[" },
            { text: "9", capText: "9", altText: "]", altCapText: "]" },
            { text: "0", capText: "0", altText: "}", altCapText: "}" },
            { text: "^", capText: "^" },
            { isBackspace: true, icon: icons.backspace }
        ], [
            { text: ".", capText: "." },
            { text: ",", capText: "," },
            { text: ":", capText: ":" },
            { text: ";", capText: ";" },
            { text: "!", capText: "!" },
            { text: "?", capText: "?" },
            { text: "\"", capText: "\"" },
            { text: "§", capText: "§" },
            { text: "$", capText: "$" },
            { text: "%", capText: "%" },
            { text: "&", capText: "&" },
            { isEnter: true, icon: icons.enter }
        ], [
            { isCapsLock: true, icon: icons.capslock, isDisabled: true },
            { text: "/", capText: "/" },
            { text: "(", capText: "(" },
            { text: ")", capText: ")" },
            { text: "=", capText: "=" },
            { text: "\\", capText: "\\" },
            { text: "+", capText: "+" },
            { text: "*", capText: "*" },
            { text: "#", capText: "#" },
            { text: ".", capText: "." },
            { text: "@", capText: "@" },
            { text: "€", capText: "€" },
            { text: "°", capText: "°" }
        ], [
            { text: "abc", capText: "ABC", isMode: true },
            { isSpaceBar: true },
            { isDone: true, icon: icons.done }
        ]
    ]
}

const keyboard = new WPEKeyboard(keys);

function isEditable(element) {
    if (element.nodeName === "TEXTAREA")
        return true;

    if (element.nodeName === "INPUT") {
        switch (element.type) {
            case "date":
            case "datetime-local":
            case "email":
            case "month":
            case "number":
            case "password":
            case "search":
            case "tel":
            case "text":
            case "time":
            case "url":
            case "week":
                return true;
            default:
                return false;
        }
    }

    return false;
}

function showKeyboardIfNeeded() {
    const activeElement = document.activeElement;
    if (activeElement && isEditable(activeElement))
        keyboard.show();
}

showKeyboardIfNeeded();

function addFocusListeners(element) {
    element.addEventListener("focus", () => { keyboard.show(); });
    element.addEventListener("blur", () => { keyboard.hide(); });
}

for (input of document.getElementsByTagName("input")) {
    if (isEditable(input))
        addFocusListeners(input);
}

for (textarea of document.getElementsByTagName("textarea")) {
    if (isEditable(textarea))
        addFocusListeners(textarea);
}

function forEachElementInNode(node, callback) {
    if (node.nodeType !== Node.ELEMENT_NODE)
        return;

    callback(node);

    for (child of node.children) {
        forEachElementInNode(child, callback);
    }
}

const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
            mutation.addedNodes.forEach((node) => {
                forEachElementInNode(node, (element) => {
                    if (isEditable(element))
                        addFocusListeners(element);
                });
            });
        }
    });
});
 
mutationObserver.observe(document.body, {
    subtree: true,
    childList: true,
});
