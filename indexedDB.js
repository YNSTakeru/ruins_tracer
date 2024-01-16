export default class Database {
  _isDbOpened = false;

  constructor({ dbName = "testdb", dbVersion = 1 }) {
    this._dbName = dbName;
    this._dbVersion = dbVersion;
    this._dbRequest = indexedDB.open(dbName, dbVersion);

    this._dbRequest.onupgradeneeded = function (event) {
      console.log("Upgrade needed!");

      this._db = event.target.result;
      this._db.createObjectStore("photos", {
        keyPath: "id",
      });
    };

    this._dbRequest.onerror = function (event) {
      console.log("Error!");
      console.log(event.target.errorCode);
      this._isDbOpened = false;
    };

    this._dbRequest.onsuccess = function (event) {
      console.log("Success!");
      this._db = event.target.result;
      this._transaction = this._db.transaction("photos", "readwrite");
      this._store = this._transaction.objectStore("photos");

      this._store.add({ id: "1", ruinName: "遺跡名", photoSrc: "画像" });
    };
    this._dbRequest.onblocked = function (event) {
      console.log("Blocked!");
      console.log(event.target.result);
    };
  }

  register(item) {
    if (!this._isDbOpened) {
      alert("データベースに問題があります。");
      return;
    }
    this._db = this._dbRequest.result;
    this._transaction = this._db.transaction("photos", "readwrite");
    this._store = this._transaction.objectStore("photos");
    this._request = this._store.add(item);

    this._request.onsuccess = function () {
      alert("データを保存しました。");
    };

    this._request.onerror = function () {
      alert("データを保存できませんでした。");
    };
  }
}
