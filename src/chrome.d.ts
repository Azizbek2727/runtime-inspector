declare namespace chrome {
  namespace tabs {
    interface Tab {
      id?: number;
    }

    function query(queryInfo: {
      active: boolean;
      currentWindow: boolean;
    }): Promise<Tab[]>;
  }

  namespace scripting {
    interface InjectionResult<T> {
      frameId: number;
      result?: T;
    }

    function executeScript<T>(injection: {
      target: {
        tabId: number;
      };
      world: 'ISOLATED';
      func: () => T | Promise<T>;
    }): Promise<Array<InjectionResult<Awaited<T>>>>;
  }
}
