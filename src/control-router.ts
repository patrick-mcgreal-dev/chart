type ControlMap = {
  [keys: string] : Function,
};

export interface API {
  addControlMap: (id: string, ctrlMap: ControlMap) => void;
  removeControlMap: (id: string) => void;
  setControlMap: (id: string, clearKeysPressed?: boolean) => boolean;
  getControlMap: (id: string) => ControlMap | null;
  activeControlMap: string;
  close: () => void;
};

export const get = () : API => {

  let controlMaps: {
    [id: string] : {
      modkeys: Array<string>,
      map: ControlMap,
    };
  } = {};

  let activeControlMap: {
    modkeys: Array<string>,
    map: ControlMap;
  } = {
    modkeys: [],
    map: {},
  };

  let activeControlMapId: string = "";

  let keysPressed: Array<string> = [];

  function keydown(e: KeyboardEvent) : void {

    if (keysPressed.length > 3) {
      keysPressed = [];
      return;
    }
  
    let keycode = e.code;
  
    const digit = parseInt(e.key);
    if (!Number.isNaN(digit)) {
      keycode = "Digit";
    }
  
    keysPressed.push(keycode);
  
    const keyString = keysPressed.join(" ");
    const fn = activeControlMap.map[keyString];
  
    if (fn) {
      
      if (fn(digit)) {
        e.preventDefault();
      }
      
      keysPressed = keysPressed.filter(k => k.includes("*"));
  
    }
  
    if (activeControlMap.modkeys.includes(keycode)) {
      keysPressed = [ `*${keycode}` ];
    }
  
  }
  
  function keyup(e: KeyboardEvent) : void {
  
    let keycode;
  
    if (activeControlMap.modkeys.includes(e.code)) {
  
      keycode = `-*${e.code}`;
      keysPressed = keysPressed.filter(k => k != `*${e.code}`);
  
    } else {
  
      keycode = `-${e.code}`;
      keysPressed = keysPressed.filter(k => k != e.code);
  
    }
  
    const fn = activeControlMap.map[keycode];
  
    if (fn) {

      e.preventDefault();
      fn();

    }

    keysPressed = keysPressed.filter(k => k.includes("*"));
  
  }

  function blur() : void {
    keysPressed = [];
  }

  document.addEventListener("keydown", keydown);
  document.addEventListener("keyup", keyup);
  document.addEventListener("blur", blur);

  return {

    addControlMap: (id: string, ctrlMap: ControlMap) : void => {

      const modkeys = new Array<string>();

      for (let [keys] of Object.entries(ctrlMap)) {
        const modkey = keys.match(/(?<=\*)(.*?)(?=\ )/gm);
        if (modkey && modkey.length && !modkeys.includes(modkey[0])) {
          modkeys.push(modkey[0]);
        }
      }

      controlMaps[id] = {
        modkeys: modkeys,
        map: ctrlMap,
      };

    },

    removeControlMap: (id: string) : void => {

      const controls = controlMaps[id];
      if (controls) delete controlMaps[id];

    },

    setControlMap: (id: string, clearKeysPressed: boolean = false) : boolean => {

      if (id == "") {
        activeControlMap = {
          modkeys: new Array<string>(),
          map: {},
        };
        activeControlMapId = "";
        if (clearKeysPressed) keysPressed = [];
        return true;
      }

      const controlMap = controlMaps[id];

      if (controlMap) {
        activeControlMap = controlMap;
        activeControlMapId = id;
        if (clearKeysPressed) keysPressed = [];
        return true;
      }

      return false;

    },

    getControlMap: (id: string) : ControlMap | null => {

      return controlMaps[id].map || null;

    },
    
    get activeControlMap() : string {

      return activeControlMapId;

    },

    close: () : void => {
      
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("keyup", keyup);
      document.removeEventListener("blur", blur);
      
    },

  };

};