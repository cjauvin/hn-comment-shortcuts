console.log("HN extension");

let result = document.evaluate(
  '//tr[contains(@class, "athing") and contains(@class, "comtr")]',
  document,
  null,
  XPathResult.ANY_TYPE,
  null
);

let elem,
  elems = []; // elems is a list of <tr> nodes
while ((elem = result.iterateNext())) {
  elems.push(elem);
}

// The ID keys in this table should remain strings, to avoid confusion
let comments = { "0": { elem: null, parent: null, children: [] } }; // id -> {elem, parent, children}

for (elem of elems) {
  comments[elem.id] = { elem, parent: null, children: [] };
}

let levelToId = { "-1": "0" }; // level -1 is set to root

for (elem of elems) {
  let ind = document
    .evaluate('.//td[@class = "ind"]', elem, null, XPathResult.ANY_TYPE, null)
    .iterateNext();
  let level = ind.getAttribute("indent");
  levelToId[level] = elem.id;
  // find the parent on the level above the current one
  let parent = levelToId[parseInt(level) - 1];
  comments[elem.id].parent = parent;
  comments[parent].children.push(elem.id);

  comments[elem.id].elem.addEventListener(
    "click",
    (function (elemId) {
      return function () {
        currId = setCurrentComment(elemId);
      };
    })(elem.id)
  );

  // comments[elem.id].elem.addEventListener('dblclick', function(elemId) {
  //   return function(e) {
  //     setCurrentComment(elemId);
  //     toggleCurrComment();
  //     e.preventDefault();
  //   }
  // }(elem.id));
}

// This is needed to deal with negative numbers
function mod(n, m) {
  return ((n % m) + m) % m;
}

// function toggleCurrComment() {
//   let togg = document.evaluate('.//a[@class = "togg"]', comments[currId].elem, null, XPathResult.ANY_TYPE, null).iterateNext();
//   togg.click();
// }

function setCurrentComment(newId) {
  // We modify the border of the <td> child of the comment <tr>
  comments[currId].elem.firstElementChild.style.border = "";
  comments[newId].elem.firstElementChild.style.border = "thin dashed red";
  return newId;
}

function findNextComment(id) {
  if (id === "0") {
    // Special case
    currId = setCurrentComment(comments["0"].children[0]);
    comments[currId].elem.scrollIntoView(false);
    return;
  }
  let siblings = comments[comments[id].parent].children;
  let idx = siblings.indexOf(id);
  if (idx < siblings.length - 1) {
    currId = setCurrentComment(siblings[idx + 1]);
    comments[currId].elem.scrollIntoView(false);
  } else {
    findNextComment(comments[id].parent);
  }
}

let currId = comments["0"].children[0];
currId = setCurrentComment(currId);

document.addEventListener("keydown", function (e) {
  if (e.key === "n" || e.key === "p") {
    let siblings = comments[comments[currId].parent].children;
    let idx = siblings.indexOf(currId);
    idx = idx + (e.key === "n" ? 1 : -1);
    idx = mod(idx, siblings.length);
    currId = setCurrentComment(siblings[idx]);
    comments[currId].elem.scrollIntoView(false);
  } else if (e.key === "h") {
    if (comments[currId].parent !== "0") {
      currId = setCurrentComment(comments[currId].parent);
    }
  } else if (e.key === "l") {
    let isCollapsed = comments[currId].elem.className.includes("coll");
    if (!isCollapsed && comments[currId].children.length > 0) {
      // Child comment
      currId = setCurrentComment(comments[currId].children[0]);
      comments[currId].elem.scrollIntoView(false);
    } else {
      findNextComment(currId);
    }
  } else if (e.key === "Tab") {
    let togg = document
      .evaluate(
        './/a[@class = "togg"]',
        comments[currId].elem,
        null,
        XPathResult.ANY_TYPE,
        null
      )
      .iterateNext();
    togg.click();
    e.preventDefault();
  }
});
