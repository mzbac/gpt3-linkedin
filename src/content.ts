import { PubSub } from "./pubsub";
const pubSub = new PubSub();
const __spt3__element_store = (function () {
  let LAST_ACTIVE_EL: HTMLDivElement;

  return {
    set: (elm: HTMLDivElement) => (LAST_ACTIVE_EL = elm),
    get: () => LAST_ACTIVE_EL,
  };
})();

const __spt3__buttons_store = (function () {
  const buttons: HTMLButtonElement[] = [];
  return {
    push: (btn: HTMLButtonElement) => buttons.push(btn),
    clear: () => (buttons.length = 0),
    get: () => buttons,
  };
})();
const __spt3__BUTTONS = ["correct", "generate"];

pubSub.subscribe(
  "update-last-active-element-innerHtml",
  (result: string) => (__spt3__element_store.get().innerHTML = result)
);
pubSub.subscribe("last-active-element", (div: HTMLDivElement) =>
  __spt3__element_store.set(div)
);

pubSub.subscribe("insert-text", (text: string) => {
  const spl_text = text.replace(/^\s+|\s+$/g, "").split("\n");
  var res = "";

  for (const s of spl_text) {
    if (s == "") {
      res += "<p></p>";
    } else {
      res += "<p>" + s + "</p>";
    }
  }

  pubSub.publish("update-last-active-element-innerHtml", res);
});

const _extractText = (target: HTMLDivElement) => {
  let txt = target.innerText;
  if (txt) {
    txt = txt.replace(/(\s)+/g, "$1");
    txt = txt.trim();
    return txt;
  }
};

pubSub.subscribe("create-buttons", (parent: HTMLDivElement) => {
  for (const [index, image] of __spt3__BUTTONS.entries()) {
    // Create button
    const button = document.createElement("button");
    button.style.top = `${parent?.offsetHeight - 30 + 30 * index}px`;
    button.style.left = "-20px";
    button.style.zIndex = "1000";
    button.id = `generate-button-${index}`;
    button.classList.add("generate-button");

    // Add image inside button
    const img = document.createElement("img");
    img.src = chrome.runtime.getURL(`images/${image}.png`);
    img.style.pointerEvents = "none";
    button.appendChild(img);

    // Add onclick event
    button.addEventListener("click", () => {
      const text = _extractText(parent);
      const promptPrefix =
        image === "correct" ? "Correct this to standard English:\n\n" : "\n\n";
      parent.focus();
      _setButtonLoading();
      chrome.runtime.sendMessage({ text: promptPrefix + text });
    });

    // Append button to parent of input
    parent?.parentNode?.appendChild(button);
    __spt3__buttons_store.push(button);
  }
});

pubSub.subscribe("delete-buttons", () => {
  __spt3__buttons_store.get().forEach((btn) => {
    btn.remove();
  });
  __spt3__buttons_store.clear();
});

const getAllEditable = () => {
  return document.querySelectorAll<HTMLDivElement>('[role="textbox"]');
};

const _setButtonLoading = () => {
  __spt3__buttons_store.get().forEach((button) => {
    button.innerHTML = "<div class='spinner'></div>";
    button.disabled = true;

    // Remove all classes
    button.classList.remove("generate-button-error");

    // add loading class to button
    button.classList.add("generate-button-loading");
  });
};

pubSub.subscribe("set-button-error", (err: Error) => {
  console.log(err);
});

pubSub.subscribe("set-button-loaded", () => {
  __spt3__buttons_store.get().forEach((button, idx) => {
    // Remove all classes
    button.classList.remove("generate-button-loading");
    button.classList.remove("generate-button-error");

    // Add image inside button
    const img = document.createElement("img");
    img.src = chrome.runtime.getURL(`images/${__spt3__BUTTONS[idx]}.png`);
    button.innerHTML = "";
    button.disabled = false;
    button.appendChild(img);
  });
});

const handleClick = (e: any) => {
  // If element is GPT-3 button, do nothing
  if (__spt3__buttons_store.get().includes(e.target)) {
    return;
  }

  // If element is in editable parent, create button
  const editableDivs = getAllEditable();
  for (const div of editableDivs) {
    if (div.contains(e.target)) {
      pubSub.publish("delete-buttons", null);
      pubSub.publish("last-active-element", div);
      pubSub.publish("create-buttons", div);
      break;
    }
  }
};

// Add event listeners
document.body.addEventListener("click", handleClick);
document.body.addEventListener("resize", () =>
  pubSub.publish("delete-buttons", null)
);
document.body.addEventListener("scroll", () =>
  pubSub.publish("delete-buttons", null)
);

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request) => {
  if (request.generate) {
    if (request.generate.error) {
      pubSub.publish("set-button-error", request.generate.error.message);
      return;
    }

    pubSub.publish("insert-text", request.generate.text ?? "");
    pubSub.publish("set-button-loaded", null);
  }
});
