
function createElement(type, props, ...children) {

  return {
    type,
    props: {
      ...props,
      children: children.map(child => (
        typeof child === 'object'
          ? child
          : createTextElement(child)
      ))
    }
  }
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: []
    }
  }
}

function commitWork(fiber) {
  if (!fiber) {
    return
  };

  const domParent = fiber.parent.dom;
  domParent.appendChild(fiber.dom);
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitRoot() {
  commitWork(wipRoot.child);
  wipRoot = null;
}

let nextUnitOfWork = null;
let wipRoot = null;

function workLoop(deadline) {
  let shouldYield = false;
  while(nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  requestIdleCallback(workLoop);

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
}

requestIdleCallback(workLoop);

function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }

  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom)
  }

  const elements = fiber.props.children;

  let index = 0;

  let prevSibling = null;

  while (index < elements.length) {
    const element = elements[index];

    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null
    }

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber;

    index++;
  }

  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent;
  }

}

function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    }
  }

  nextUnitOfWork = wipRoot;
}

function createDom(fiber) {
  const dom = fiber.type === "TEXT_ELEMENT"
    ? document.createTextNode("")
    : document.createElement(fiber.type)

  const isProperty = key => key !== "children"
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = fiber.props[name]
    })

  return dom;
}

const Didact = {
  createElement,
  render
}


const ReactDom = window.ReactDOM;

/**  @jsx Didact.createElement */
const element = (
  <div id="foo">
    <a>test</a>
  </div>
)

Didact.render(
  element,
  document.getElementById('root')
)