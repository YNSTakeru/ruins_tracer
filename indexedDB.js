export default class Database {
  constructor({ dbName = "testdb", dbVersion = 1 }) {
    this._dbName = dbName;
    this._dbVersion = dbVersion;
    this._dbRequest = indexedDB.open(dbName, dbVersion);

    this._dbRequest.onupgradeneeded = function (event) {
      console.log("Upgrade needed!");

      this._db = event.target.result;
      this._db.createObjectStore("photos", {
        keyPath: "id",
        autoIncrement: true,
      });
    };

    this._dbRequest.onerror = function (event) {
      console.log("Error!");
      console.log(event.target.errorCode);
    };
    this._dbRequest.onsuccess = function (event) {
      console.log("Success!");
      this._db = event.target.result;
      this._transaction = this._db.transaction("photos", "readwrite");
      this._store = this._transaction.objectStore("photos");

      this._store.add({ ruinName: "遺跡名", photoSrc: "画像" });
    };
    this._dbRequest.onblocked = function (event) {
      console.log("Blocked!");
      console.log(event.target.result);
    };
  }
}
