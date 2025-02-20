/**
 * Base component
 *
 * @tag my-component
 *
 * @cssprop --my-component-color - The color of the component
 * @cssprop --my-component-background-color - The background color of the component
 * 
 * @csspart title - The title of the component
 * @csspart content - The content of the component
 * 
 * @slot - The title of the component
 * 
 * @event my-event - My event
 * 
 * @cssState active - The active state of the component
 * @cssState disabled - The disabled state of the component
 */
export class MyComponent extends HTMLElement {
  name: string;
  age: number;
  active: boolean;
  hobby: "sports" | "music" | "art";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = `
      <style>
        h1 {
          color: blue;
        }
      </style>
      `;
    }
  }
}

/**
 * Basic component that extends another component
 *
 * @tag my-ext-component
 *
 */
export class MyExtComponent extends MyComponent {}

/**
 * Component where items are omitted from the CEM config
 *
 * @tag my-config-omit-component
 *
 */
export class MyConfigOmitComponent extends MyComponent {}

/**
 * Component where items are omitted from the JSDoc tags
 *
 * @tag my-config-omit-component
 *
 * @omit age
 * @omit-part content
 * @omit-cssprop --my-component-background-color
 * @omit-event my-event
 * 
 */
export class MyJsDocOmitComponent extends MyComponent {}
