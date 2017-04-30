/*
   Provides pretty console.log messages, by key.
*/
var types: Object = {};

var isEdge: boolean = (function () {
      if (!window.clientInformation) return false; //gee thanks firefox
      if (window.clientInformation.appVersion && window.clientInformation.appVersion.indexOf("Edge") != -1) return true;
      if (window.clientInformation.userAgent && window.clientInformation.userAgent.indexOf("Edge") != -1) return true;
      return false;
})();

export class LogType {
      constructor(
            public prefix: string = "",
            public textColor: string = "#000",
            public bgColor: string = "#fff",
            public enabled: boolean = true
      ) { }

      public log(msg: string) {
            if (this.enabled) {
                  if (isEdge) {
                        //doesn't support css in logs
                        console.log(this.prefix + msg);
                  } else {
                        console.log("%c" + this.prefix + msg, "background:" + this.bgColor + "; color:" + this.textColor + ";");
                  }
            }
      }
}

export function setLogType(name: string, type: LogType) {
      if (!types.hasOwnProperty(name))
            types[name] = type;
}

export function log(typeName: string, msg: string) {
      if (types.hasOwnProperty(typeName))
            types[typeName].log(msg);
}
