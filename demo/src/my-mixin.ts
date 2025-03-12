export function mixinElementInternals(base) {
  class WithElementInternalsElement extends base {
    get internals() {
      return this.#internals;
    }

    myProp = 'test';

    #internals = this.attachInternals();
  }

  return WithElementInternalsElement;
}
