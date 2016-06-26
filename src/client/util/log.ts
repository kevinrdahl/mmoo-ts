/*
   Provides pretty console.log messages, by key.
*/
var types:Object = {};

export class LogType {
   constructor(
      public prefix:string = "",
      public textColor:string = "#000",
      public bgColor:string = "#fff",
      public enabled:boolean = true
   ) {}

   public log(msg:string) {
      if (this.enabled)
         console.log("%c"+this.prefix+msg, "background:"+this.bgColor+"; color:"+this.textColor+";");
   }
}

export function setLogType(name:string, type:LogType) {
   if (!types.hasOwnProperty(name))
      types[name] = type;
}

export function log(typeName:string, msg:string) {
   if (types.hasOwnProperty(typeName))
      types[typeName].log(msg);
}
